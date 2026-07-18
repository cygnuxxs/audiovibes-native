import { Directory, File, Paths } from "expo-file-system";
import { generateRandomId } from "./utils";
import { useDownloadStore } from "@/store/downloadStore";
import { StorageAccessFramework } from "expo-file-system/legacy";
import * as FileSystem from "expo-file-system/legacy";
import { ffmpeg } from '@cygnuxxs/writer';
import { Platform } from "react-native";

// --- HELPER FUNCTIONS ---

/** Ensures a directory exists and returns it, removing redundant creation logic */
function ensureDirectory(basePath: Directory, folderName: string): Directory {
    const dir = new Directory(basePath, folderName);
    if (!dir.exists) {
        dir.create({
            intermediates: true,
            idempotent: true,
        });
    }
    return dir;
}

/** Helper to extract comma-separated names for specific artist roles */
function getArtistNamesByRole(artists: any[] | undefined, role: string): string | undefined {
    if (!artists) return undefined;
    return artists.filter(a => a.role === role).map(a => a.name).join(', ') || undefined;
}

/** Helper to convert file:// URIs to local paths for FFmpeg */
function getLocalPath(uri: string): string {
    if (uri.startsWith('file://')) {
        return decodeURIComponent(uri.replace(/^file:\/\//, ''));
    }
    return uri;
}

/** Helper to decode HTML entities from API responses */
function decodeHTMLEntities(text: string): string {
    if (!text) return "";
    return text
        .replace(/&quot;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

// --- MAIN FUNCTIONS ---

export async function downloadRawSongAndArtCover(
    imageUrl: string,
    songUrl: string,
    onProgress?: (progress: number) => void
): Promise<{
    success: boolean;
    songUri: string | null;
    imageUri: string | null;
}> {
    const directory = ensureDirectory(Paths.cache, "audiovibes");
    const randomId = generateRandomId(8);
    const songFile = new File(directory, `${randomId}.m4a`);
    const imageFile = new File(directory, `${randomId}.jpg`);

    try {
        const downloadResumable = FileSystem.createDownloadResumable(
            songUrl,
            songFile.uri,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                if (onProgress) onProgress(progress);
            }
        );

        // PERF: Download both files in parallel instead of waiting for one to finish before starting the other
        const [songOutput, imageOutput] = await Promise.all([
            downloadResumable.downloadAsync(),
            File.downloadFileAsync(imageUrl, imageFile)
        ]);

        if (!songOutput?.uri || !imageOutput.exists) {
            throw new Error("One or more files failed to download");
        }

        return {
            success: true,
            songUri: songOutput.uri,
            imageUri: imageOutput.uri,
        };
    } catch {
        // Clean up partial downloads if anything fails
        if (songFile.exists) songFile.delete();
        if (imageFile.exists) imageFile.delete();

        return {
            success: false,
            songUri: null,
            imageUri: null,
        };
    }
}

export async function writeMetadataAndArtCover(
    songUri: string,
    imageUri: string,
    song: Song // Replace 'any' with your actual Song type/interface
): Promise<string | null> {
    // Using cache directory for the temporary ffmpeg output
    const directory = ensureDirectory(Paths.cache, "audiovibes");

    // Decode HTML entities (e.g. &quot;) and remove only illegal file path characters
    const decodedTitle = decodeHTMLEntities(song.title || "");
    const safeTitle = decodedTitle.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const outputFile = new File(directory, `${safeTitle}.m4a`);

    // Clean up description building using a filtered array
    const description = [
        song.id && `ID: ${song.id}`,
        song.play_count && `Plays: ${song.play_count}`,
        (song.explicit_content === "1" || song.explicit_content === "true") && `Explicit: Yes`,
        getArtistNamesByRole(song.artists, 'starring') && `Starring: ${getArtistNamesByRole(song.artists, 'starring')}`,
        getArtistNamesByRole(song.artists, 'lyricist') && `Lyricist: ${getArtistNamesByRole(song.artists, 'lyricist')}`
    ].filter(Boolean).join(' | ');

    try {

        await ffmpeg.writeMetadata(
            getLocalPath(songUri),
            getLocalPath(outputFile.uri),
            {
                title: decodedTitle,
                artist: song.primary_artist_name || getArtistNamesByRole(song.artists, 'singer') || undefined,
                album: song.album,
                albumArtist: song.music,
                composer: song.music,
                genre: song.language,
                date: song.release_date || song.year,
                copyright: song.copyright_text,
                publisher: song.label,
                comment: song.subtitle,
                description: description || undefined,
                encoder: song.kbps_320 === "true" ? "audiovibes (320kbps)" : "audiovibes",
            },
            imageUri ? getLocalPath(imageUri) : undefined
        );

        let finalUri = outputFile.uri;
        const { downloadDirectoryUri } = useDownloadStore.getState();

        if (Platform.OS === "android" && downloadDirectoryUri) {
            try {
                // Create the file in the user-selected SAF directory
                const safUri = await StorageAccessFramework.createFileAsync(
                    downloadDirectoryUri,
                    `${safeTitle}.m4a`,
                    "audio/m4a"
                );

                // Read the temporary file as base64 and write it to the SAF directory
                const base64Data = await FileSystem.readAsStringAsync(outputFile.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                await StorageAccessFramework.writeAsStringAsync(safUri, base64Data, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                finalUri = safUri;

                // Delete the temporary file from cache since we successfully copied it
                if (outputFile.exists) {
                    outputFile.delete();
                }
            } catch (safError) {
                console.error("Failed to save to SAF directory:", safError);
                // Fallback to internal storage if SAF fails
            }
        }

        return finalUri;

    } catch (error) {
        console.error("Failed to write metadata:", error);

        // Delete potentially corrupted output file
        if (outputFile.exists) {
            outputFile.delete();
        }
        return null;

    } finally {
        // GUARANTEED CLEANUP: This runs regardless of success or failure
        try {
            const cachedSong = new File(songUri);
            const cachedImage = new File(imageUri);

            if (cachedSong.exists) cachedSong.delete();
            if (cachedImage.exists) cachedImage.delete();
        } catch (cleanupError) {
            console.warn("Failed to delete cache files:", cleanupError);
        }
    }
}
