import { type HybridObject } from 'react-native-nitro-modules';

export interface Installer extends HybridObject<{ android: 'kotlin' }> {
    apkInstall(localUri: string): Promise<void>;
    openInstallSettings(): Promise<void>;
}
