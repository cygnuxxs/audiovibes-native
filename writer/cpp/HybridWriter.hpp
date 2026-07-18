#pragma once

#include "HybridWriterSpec.hpp"
#include <NitroModules/Promise.hpp>

namespace margelo::nitro::writer
{
    class HybridWriter : public HybridWriterSpec
    {
    public:
        HybridWriter() : HybridObject(TAG) {}

        std::shared_ptr<Promise<void>>
        writeMetadata(const std::string &input, const std::string &output, const Metadata &metadata,
                      const std::optional<std::string> &artwork) override;

        std::shared_ptr<Promise<Metadata>> readMetadata(const std::string &input) override;
        std::shared_ptr<Promise<void>> clearMetadata(const std::string &input, const std::string &output) override;
    };
}
