#include "HybridWriter.hpp"
#include <NitroModules/Promise.hpp>

#include <memory>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

extern "C"
{
#include <libavformat/avformat.h>
#include <libavutil/dict.h>
#include <libavutil/error.h>
}

namespace margelo::nitro::writer
{

    namespace
    {

        // --------------------------------------------------------------------------
        // RAII wrappers — guarantee cleanup even if an exception unwinds mid-function
        // (the original code leaked inCtx/outCtx/artCtx on every throw path).
        // --------------------------------------------------------------------------

        struct InputContextDeleter
        {
            void operator()(AVFormatContext *ctx) const
            {
                if (ctx)
                    avformat_close_input(&ctx);
            }
        };
        using InputContextPtr = std::unique_ptr<AVFormatContext, InputContextDeleter>;

        struct OutputContextDeleter
        {
            void operator()(AVFormatContext *ctx) const
            {
                if (!ctx)
                    return;
                if (ctx->pb)
                    avio_closep(&ctx->pb);
                avformat_free_context(ctx);
            }
        };
        using OutputContextPtr = std::unique_ptr<AVFormatContext, OutputContextDeleter>;

        struct PacketDeleter
        {
            void operator()(AVPacket *pkt) const { av_packet_free(&pkt); }
        };
        using PacketPtr = std::unique_ptr<AVPacket, PacketDeleter>;

        std::string avError(int errnum)
        {
            char buf[AV_ERROR_MAX_STRING_SIZE] = {0};
            av_strerror(errnum, buf, sizeof(buf));
            return buf;
        }

        InputContextPtr openInput(const std::string &path)
        {
            AVFormatContext *ctx = nullptr;
            int ret = avformat_open_input(&ctx, path.c_str(), nullptr, nullptr);
            if (ret < 0)
            {
                throw std::runtime_error("Could not open input file '" + path + "': " + avError(ret));
            }
            avformat_find_stream_info(ctx, nullptr);
            return InputContextPtr(ctx);
        }

        OutputContextPtr openOutput(const std::string &path)
        {
            AVFormatContext *ctx = nullptr;
            if (avformat_alloc_output_context2(&ctx, nullptr, "ipod", path.c_str()) < 0 || !ctx)
            {
                throw std::runtime_error("Could not allocate output context for '" + path + "'");
            }
            OutputContextPtr outCtx(ctx);
            int ret = avio_open(&outCtx->pb, path.c_str(), AVIO_FLAG_WRITE);
            if (ret < 0)
            {
                throw std::runtime_error("Could not open output file '" + path + "': " + avError(ret));
            }
            return outCtx;
        }

        // --------------------------------------------------------------------------
        // Stream / packet remuxing, shared by writeMetadata and clearMetadata.
        // --------------------------------------------------------------------------

        // Copies every non-attached-picture stream from `src` into `dst`.
        // Returns a map from source stream index -> destination stream index
        // (-1 for streams that were skipped). This map is what makes packet
        // remuxing correct regardless of where the attached-picture stream sits
        // in the source's stream order.
        std::vector<int> copyMediaStreams(AVFormatContext *src, AVFormatContext *dst)
        {
            std::vector<int> indexMap(src->nb_streams, -1);
            for (unsigned int i = 0; i < src->nb_streams; i++)
            {
                AVStream *inStream = src->streams[i];
                if (inStream->disposition & AV_DISPOSITION_ATTACHED_PIC)
                    continue;

                AVStream *outStream = avformat_new_stream(dst, nullptr);
                avcodec_parameters_copy(outStream->codecpar, inStream->codecpar);
                outStream->codecpar->codec_tag = 0;
                indexMap[i] = outStream->index;
            }
            return indexMap;
        }

        // Remuxes every packet from `src` into `dst`, rescaling timestamps and
        // skipping streams that copyMediaStreams chose not to carry over.
        void remuxPackets(AVFormatContext *src, AVFormatContext *dst, const std::vector<int> &indexMap)
        {
            PacketPtr packet(av_packet_alloc());
            while (av_read_frame(src, packet.get()) >= 0)
            {
                int outIndex = indexMap[packet->stream_index];
                if (outIndex < 0)
                {
                    av_packet_unref(packet.get());
                    continue;
                }
                AVStream *inStream = src->streams[packet->stream_index];
                AVStream *outStream = dst->streams[outIndex];

                packet->stream_index = outIndex;
                av_packet_rescale_ts(packet.get(), inStream->time_base, outStream->time_base);
                av_interleaved_write_frame(dst, packet.get());
                av_packet_unref(packet.get());
            }
        }

        // --------------------------------------------------------------------------
        // Metadata <-> AVDictionary conversion.
        //
        // The field list below is the single source of truth for every plain
        // string/numeric tag. Previously this list was written out once (as
        // setMetaStr/setMetaNum calls) in writeMetadata and again (as getTag calls)
        // in readMetadata; a field added to one could silently be missed in the
        // other. Now both functions just iterate the same table.
        // --------------------------------------------------------------------------

        void setMetaStr(AVDictionary **dict, const char *key, const std::optional<std::string> &value)
        {
            if (value.has_value())
            {
                av_dict_set(dict, key, value.value().c_str(), 0);
            }
        }

        void setMetaNum(AVDictionary **dict, const char *key, const std::optional<double> &value)
        {
            if (value.has_value())
            {
                av_dict_set(dict, key, std::to_string(static_cast<int>(value.value())).c_str(), 0);
            }
        }

        std::optional<std::string> getMetaStr(AVDictionary *dict, const char *key)
        {
            AVDictionaryEntry *tag = av_dict_get(dict, key, nullptr, 0);
            return tag ? std::optional<std::string>(tag->value) : std::nullopt;
        }

        std::optional<double> getMetaNum(AVDictionary *dict, const char *key)
        {
            AVDictionaryEntry *tag = av_dict_get(dict, key, nullptr, 0);
            if (!tag)
                return std::nullopt;
            try
            {
                return std::stod(tag->value);
            }
            catch (...)
            {
                return std::nullopt;
            }
        }

        using StringField = std::optional<std::string> Metadata::*;
        using NumField = std::optional<double> Metadata::*;

        const std::vector<std::pair<const char *, StringField>> &stringFields()
        {
            static const std::vector<std::pair<const char *, StringField>> fields = {
                {"title", &Metadata::title},
                {"artist", &Metadata::artist},
                {"album", &Metadata::album},
                {"album_artist", &Metadata::albumArtist},
                {"composer", &Metadata::composer},
                {"genre", &Metadata::genre},
                {"date", &Metadata::date},
                {"comment", &Metadata::comment},
                {"copyright", &Metadata::copyright},
                {"encoder", &Metadata::encoder},
                {"publisher", &Metadata::publisher},
                {"lyrics", &Metadata::lyrics},
                {"grouping", &Metadata::grouping},
                {"description", &Metadata::description},
                {"synopsis", &Metadata::synopsis},
                {"show", &Metadata::show},
                {"episode_id", &Metadata::episodeId},
                {"network", &Metadata::network},
                {"media_type", &Metadata::mediaType},
            };
            return fields;
        }

        const std::vector<std::pair<const char *, NumField>> &numFields()
        {
            static const std::vector<std::pair<const char *, NumField>> fields = {
                {"track", &Metadata::track},
                {"disc", &Metadata::disc},
                {"bpm", &Metadata::bpm},
            };
            return fields;
        }

        AVDictionary *buildMetadataDict(const Metadata &metadata)
        {
            AVDictionary *dict = nullptr;
            for (const auto &[key, member] : stringFields())
            {
                setMetaStr(&dict, key, metadata.*member);
            }
            for (const auto &[key, member] : numFields())
            {
                setMetaNum(&dict, key, metadata.*member);
            }
            if (metadata.hdVideo.has_value())
            {
                setMetaStr(&dict, "hd_video", metadata.hdVideo.value() ? "1" : "0");
            }
            return dict;
        }

        Metadata parseMetadataDict(AVDictionary *dict)
        {
            Metadata result;
            for (const auto &[key, member] : stringFields())
            {
                result.*member = getMetaStr(dict, key);
            }
            for (const auto &[key, member] : numFields())
            {
                result.*member = getMetaNum(dict, key);
            }
            auto hdVideoTag = getMetaStr(dict, "hd_video");
            if (hdVideoTag.has_value())
            {
                result.hdVideo = (hdVideoTag.value() == "1");
            }
            return result;
        }

    } // namespace

    // ============================================================================
    // Public API
    // ============================================================================

    std::shared_ptr<Promise<void>> HybridWriter::writeMetadata(const std::string &input,
                                                               const std::string &output,
                                                               const Metadata &metadata,
                                                               const std::optional<std::string> &artwork)
    {
        return Promise<void>::async([=]()
                                    {
            InputContextPtr inCtx = openInput(input);
            OutputContextPtr outCtx = openOutput(output);

            std::vector<int> indexMap = copyMediaStreams(inCtx.get(), outCtx.get());

            // Handle optional artwork injection.
            InputContextPtr artCtx;
            int artOutIndex = -1;
            if (artwork.has_value()) {
                AVFormatContext *artRaw = nullptr;
                if (avformat_open_input(&artRaw, artwork.value().c_str(), nullptr, nullptr) >= 0) {
                    artCtx.reset(artRaw);
                    avformat_find_stream_info(artCtx.get(), nullptr);
                    if (artCtx->nb_streams > 0) {
                        AVStream *inArtStream = artCtx->streams[0];
                        AVStream *outArtStream = avformat_new_stream(outCtx.get(), nullptr);
                        avcodec_parameters_copy(outArtStream->codecpar, inArtStream->codecpar);
                        outArtStream->disposition |= AV_DISPOSITION_ATTACHED_PIC;
                        artOutIndex = outArtStream->index;
                    }
                }
            }

            outCtx->metadata = buildMetadataDict(metadata);

            int ret = avformat_write_header(outCtx.get(), nullptr);
            if (ret < 0) {
                throw std::runtime_error("Could not write header to '" + output + "': " + avError(ret));
            }

            remuxPackets(inCtx.get(), outCtx.get(), indexMap);

            if (artCtx && artOutIndex >= 0) {
                PacketPtr packet(av_packet_alloc());
                while (av_read_frame(artCtx.get(), packet.get()) >= 0) {
                    packet->stream_index = artOutIndex;
                    av_interleaved_write_frame(outCtx.get(), packet.get());
                    av_packet_unref(packet.get());
                }
            }

            av_write_trailer(outCtx.get()); });
    }

    std::shared_ptr<Promise<Metadata>> HybridWriter::readMetadata(const std::string &input)
    {
        return Promise<Metadata>::async([=]() -> Metadata
                                        {
            InputContextPtr inCtx = openInput(input);
            return parseMetadataDict(inCtx->metadata); });
    }

    std::shared_ptr<Promise<void>> HybridWriter::clearMetadata(const std::string &input,
                                                               const std::string &output)
    {
        // Clearing metadata is just a write with an empty tag set and no
        // artwork — no need to duplicate the whole remux pipeline here.
        return writeMetadata(input, output, Metadata{}, std::nullopt);
    }

}
