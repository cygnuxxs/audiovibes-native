# @cygnuxxs/writer

A custom [Nitro Module](https://nitro.margelo.com) for AudioVibes that injects audio metadata and artwork into M4A/MP4 files using a purpose-built, stripped-down FFmpeg build — with zero re-encoding and zero JS-thread blocking.

[![Nitro Modules](https://img.shields.io/badge/Nitro%20Modules-C%2B%2B-EF4444?style=flat-square)](https://nitro.margelo.com)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue?style=flat-square)](https://expo.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](../LICENSE)

---

## Overview

`@cygnuxxs/writer` (`NitroWriter`) exposes three async operations over Nitro's JSI bridge:

| Method | Description |
|---|---|
| `writeMetadata` | Remux an M4A file, stamping all metadata fields and optionally replacing cover art — in a single C++ pass |
| `readMetadata` | Read all metadata tags from an existing M4A/MP4 file |
| `clearMetadata` | Strip all metadata and artwork from a file |

The implementation is entirely in **C++** (`HybridWriter`) and runs on Nitro's background thread pool — the JS event loop and UI thread are never blocked.

---

## Why a Custom Native Module?

Standard React Native FFmpeg wrappers ship the full FFmpeg binary — encoders, hardware decoders, network protocols — bloating the APK/IPA by 30–60 MB. This module compiles only three FFmpeg libraries:

| Library | Purpose |
|---|---|
| `libavformat` | Container demux/mux (MP4 / M4A / iPod format) |
| `libavcodec` | Stream codec parameter copy (no re-encoding) |
| `libavutil` | Metadata dictionary, error helpers |

Result: **~4–6 MB per ABI** instead of the typical 20–60 MB.

---

## API

```typescript
// writer/src/specs/Writer.nitro.ts

export interface Metadata {
  title?: string
  artist?: string
  album?: string
  albumArtist?: string
  composer?: string
  genre?: string
  date?: string
  track?: number
  totalTracks?: number
  disc?: number
  totalDiscs?: number
  comment?: string
  copyright?: string
  encoder?: string
  publisher?: string
  lyrics?: string
  grouping?: string
  description?: string
  synopsis?: string
  show?: string
  episodeId?: string
  network?: string
  hdVideo?: boolean
  mediaType?: string
  bpm?: number
}

export interface Writer extends HybridObject<{ ios: "c++"; android: "c++" }> {
  writeMetadata(
    input: string,
    output: string,
    metadata: Metadata,
    artwork?: string     // Optional path to JPEG cover art
  ): Promise<void>

  readMetadata(input: string): Promise<Metadata>

  clearMetadata(input: string, output: string): Promise<void>
}
```

### Usage

```typescript
import { NitroModules } from 'react-native-nitro-modules'
import type { Writer } from '@cygnuxxs/writer'

const writer = NitroModules.createHybridObject<Writer>('Writer')

await writer.writeMetadata(
  '/path/to/input.m4a',
  '/path/to/output.m4a',
  {
    title: 'Song Title',
    artist: 'Artist Name',
    album: 'Album Name',
    genre: 'Pop',
    track: 1,
    totalTracks: 12,
    bpm: 128,
  },
  '/path/to/cover.jpg'  // optional
)

const tags = await writer.readMetadata('/path/to/file.m4a')
```

---

## How It Works

### Pure Remux — No Re-encoding

`writeMetadata` never decodes or re-encodes audio. The pipeline:

1. **Open input** — `avformat_open_input` reads the source M4A/MP4 container
2. **Open output** — `avformat_alloc_output_context2` in `"ipod"` (M4A) format
3. **Copy stream parameters** — `avcodec_parameters_copy` preserves bitrate, sample rate, codec exactly
4. **Skip old artwork streams** — replaced by the new cover if provided
5. **Inject artwork** — opens the JPEG as a separate `AVFormatContext`, adds an `AV_DISPOSITION_ATTACHED_PIC` stream
6. **Write metadata dictionary** — built from the `Metadata` struct via a shared static field table
7. **Remux packets** — `av_interleaved_write_frame` + `av_packet_rescale_ts`; audio data passes through untouched

### RAII C++ — No Leaks

Context handles use custom deleters so destructors run on every code path, including exceptions:

```cpp
struct InputContextDeleter {
    void operator()(AVFormatContext* ctx) const { avformat_close_input(&ctx); }
};
using InputContextPtr = std::unique_ptr<AVFormatContext, InputContextDeleter>;
```

### Single Source of Truth for Metadata Fields

All 24 metadata fields are declared in one static table shared by both `writeMetadata` and `readMetadata` — adding a new field to the spec automatically applies it to both read and write paths.

---

## Structure

```
writer/
├── src/
│   ├── index.ts                    # Public TypeScript exports
│   └── specs/
│       └── Writer.nitro.ts         # HybridObject interface spec (Nitrogen input)
├── cpp/
│   ├── HybridWriter.hpp            # Class declaration
│   └── HybridWriter.cpp            # Core C++ FFmpeg remux + metadata logic
├── ffmpeg/
│   ├── include/                    # libavformat, libavcodec, libavutil headers
│   └── libs/                       # Per-ABI static libraries (.a)
│       ├── arm64-v8a/
│       ├── armeabi-v7a/
│       └── x86_64/
├── android/
│   ├── build.gradle                # Gradle config — applies Nitrogen autolinking
│   ├── CMakeLists.txt              # Links FFmpeg .a static libs via --start-group
│   └── src/main/cpp/
│       └── cpp-adapter.cpp         # Autolinks HybridWriter into the shared library
├── ios/                            # iOS-specific autolinking stubs
├── nitrogen/                       # Nitrogen-generated autolinking files (committed)
├── nitro.json                      # Nitrogen config — namespace, library name, autolinking
├── NitroWriter.podspec             # iOS CocoaPods spec
└── package.json                    # npm package manifest
```

---

## Build System

### Android — `CMakeLists.txt`

The three FFmpeg static archives are linked with `--start-group` / `--end-group` to resolve circular symbol references:

```cmake
target_link_libraries(${PACKAGE_NAME}
    -Wl,--start-group
        ${FFMPEG_ROOT}/libs/${ANDROID_ABI}/libavformat.a
        ${FFMPEG_ROOT}/libs/${ANDROID_ABI}/libavcodec.a
        ${FFMPEG_ROOT}/libs/${ANDROID_ABI}/libavutil.a
    -Wl,--end-group
    ${LOG_LIB} ${ANDROID_LIB} ${ZLIB_LIB}
)
```

### iOS — `NitroWriter.podspec`

`HybridWriter.cpp` is compiled inline by CocoaPods — no pre-built fat library needed on iOS:

```ruby
s.source_files = [
  "ios/**/*.{swift}",
  "ios/**/*.{m,mm}",
  "cpp/**/*.{hpp,cpp}",   # HybridWriter compiled inline
]
load 'nitrogen/generated/ios/NitroWriter+autolinking.rb'
add_nitrogen_files(s)
```

### Regenerate Nitrogen Files

After changing the spec:

```bash
cd writer
pnpm specs   # tsc + nitrogen --logLevel="debug"
```

---

## Nitro Configuration (`nitro.json`)

```json
{
  "cxxNamespace": ["writer"],
  "ios": { "iosModuleName": "NitroWriter" },
  "android": {
    "androidNamespace": ["writer"],
    "androidCxxLibName": "NitroWriter"
  },
  "autolinking": {
    "Writer": {
      "all": {
        "language": "c++",
        "implementationClassName": "HybridWriter"
      }
    }
  }
}
```

`language: "c++"` with `"all"` means the same C++ class is used on both Android and iOS — no platform-specific Kotlin or Swift wrapper needed.

---

## License

[MIT](../LICENSE) © cygnuxxs
