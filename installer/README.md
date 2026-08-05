# @cygnuxxs/apkinstaller

A custom [Nitro Module](https://nitro.margelo.com) for AudioVibes that installs APK files on Android using the platform's native package installer intent. Android-only.

[![Nitro Modules](https://img.shields.io/badge/Nitro%20Modules-Kotlin-7F52FF?style=flat-square)](https://nitro.margelo.com)
[![Platform](https://img.shields.io/badge/Platform-Android%20only-green?style=flat-square)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](../LICENSE)

---

## Overview

`@cygnuxxs/apkinstaller` (`NitroInstaller`) exposes two Android operations over Nitro's JSI bridge:

- **`apkInstall`** — triggers the system package-installer intent for a given APK file URI, allowing AudioVibes to self-update without leaving the app.
- **`openInstallSettings`** — opens the "Install unknown apps" settings page so the user can grant the required permission if not already set.

The module is implemented in **Kotlin** (`HybridInstaller`) and autolinked via Nitrogen. No C++ is involved.

---

## API

```typescript
import { type HybridObject } from 'react-native-nitro-modules'

export interface Installer extends HybridObject<{ android: 'kotlin' }> {
  /** Triggers the system APK installer for the file at `localUri`. */
  apkInstall(localUri: string): Promise<void>

  /** Opens Android's "Install unknown apps" permission settings screen. */
  openInstallSettings(): Promise<void>
}
```

### Usage

```typescript
import { NitroModules } from 'react-native-nitro-modules'
import type { Installer } from '@cygnuxxs/apkinstaller'

const installer = NitroModules.createHybridObject<Installer>('Installer')

// Install a downloaded APK
await installer.apkInstall('file:///data/user/0/com.audiovibes/cache/update.apk')

// Open settings if permission is missing
await installer.openInstallSettings()
```

---

## Structure

```
installer/
├── src/
│   ├── index.ts                        # Public TypeScript exports
│   └── specs/
│       └── Installer.nitro.ts          # HybridObject interface spec (Nitrogen input)
├── android/
│   ├── build.gradle                    # Gradle config — applies Nitrogen autolinking
│   ├── CMakeLists.txt                  # CMake build (no C++ sources; only autolinking glue)
│   └── src/main/java/com/margelo/nitro/installer/
│       └── NitroInstallerPackage.kt    # React Native package — registers HybridInstaller
├── ios/                                # Stub (module is Android-only)
├── nitrogen/                           # Nitrogen-generated autolinking files (committed)
├── nitro.json                          # Nitrogen config — namespace, library name, autolinking
├── NitroInstaller.podspec              # iOS CocoaPods spec (no-op for Android-only module)
└── package.json                        # npm package manifest
```

---

## Nitro Configuration (`nitro.json`)

```json
{
  "cxxNamespace": ["installer"],
  "ios": { "iosModuleName": "NitroInstaller" },
  "android": {
    "androidNamespace": ["installer"],
    "androidCxxLibName": "NitroInstaller"
  },
  "autolinking": {
    "Installer": {
      "android": {
        "language": "kotlin",
        "implementationClassName": "HybridInstaller"
      }
    }
  }
}
```

The `language: "kotlin"` entry means Nitrogen generates a Kotlin abstract base class (`HybridInstallerSpec`) that `HybridInstaller` extends. No C++ implementation class is required.

---

## Build

Regenerate Nitrogen autolinking files after changing the spec:

```bash
cd installer
pnpm specs   # tsc + nitrogen --logLevel="debug"
```

This outputs updated files into `nitrogen/generated/`.

---

## License

[MIT](../LICENSE) © cygnuxxs
