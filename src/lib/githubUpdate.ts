import * as FileSystem from "expo-file-system/legacy";
import { Linking, Platform } from "react-native";
import Constants from "expo-constants";

const GITHUB_REPO = "cygnuxxs/audiovibes-native";
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface GithubRelease {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    html_url: string;
    assets: GithubAsset[];
}

export interface GithubAsset {
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
}

export interface UpdateInfo {
    available: boolean;
    release?: GithubRelease;
    apkAsset?: GithubAsset;
    currentVersion: string;
    latestVersion: string;
    deviceArch?: DeviceArchInfo;
}

export interface DeviceArchInfo {
    primaryAbi: string;
    is64Bit: boolean;
    bitLabel: "64bit" | "32bit";
}

/**
 * Detects mobile device CPU architecture and bitness (32bit vs 64bit).
 */
export function getDeviceArchitecture(): DeviceArchInfo {
    const platformConstants = (Platform.constants || {}) as {
        SUPPORTED_ABIS?: string[];
        SUPPORTED_64_BIT_ABIS?: string[];
        SUPPORTED_32_BIT_ABIS?: string[];
    };

    const supportedAbis = platformConstants.SUPPORTED_ABIS || [];
    const supported64 = platformConstants.SUPPORTED_64_BIT_ABIS || [];

    let primaryAbi = supportedAbis[0] || "";

    if (!primaryAbi && Constants.systemArchitectures) {
        if (Array.isArray(Constants.systemArchitectures)) {
            primaryAbi = Constants.systemArchitectures[0] || "";
        } else if (typeof Constants.systemArchitectures === "string") {
            primaryAbi = Constants.systemArchitectures;
        }
    }

    const abiLower = primaryAbi.toLowerCase();

    const is64Bit =
        supported64.length > 0 ||
        abiLower.includes("64") ||
        abiLower.includes("arm64") ||
        abiLower.includes("aarch64") ||
        abiLower.includes("x86_64");

    return {
        primaryAbi: primaryAbi || (is64Bit ? "arm64-v8a" : "armeabi-v7a"),
        is64Bit,
        bitLabel: is64Bit ? "64bit" : "32bit",
    };
}

/**
 * Selects the best matching APK asset for the current device architecture.
 */
export function selectMatchingApkAsset(assets: GithubAsset[]): GithubAsset | undefined {
    const apkAssets = assets.filter(
        (a) =>
            a.name.endsWith(".apk") ||
            a.content_type === "application/vnd.android.package-archive"
    );

    if (apkAssets.length === 0) return undefined;
    if (apkAssets.length === 1) return apkAssets[0];

    const deviceArch = getDeviceArchitecture();
    const abi = deviceArch.primaryAbi.toLowerCase();
    const is64 = deviceArch.is64Bit;

    // 1. Try exact/specific ABI match in filename (e.g. "arm64-v8a", "armeabi-v7a", "x86_64", "x86")
    const exactAbiMatch = apkAssets.find((a) => a.name.toLowerCase().includes(abi));
    if (exactAbiMatch) return exactAbiMatch;

    // 2. Try bitness label match (e.g. "64bit", "64-bit", "arm64" vs "32bit", "32-bit", "v7a", "arm")
    const bitMatch = apkAssets.find((a) => {
        const name = a.name.toLowerCase();
        if (is64) {
            return (
                name.includes("64bit") ||
                name.includes("64-bit") ||
                name.includes("arm64") ||
                name.includes("v8a") ||
                name.includes("x86_64")
            );
        } else {
            return (
                name.includes("32bit") ||
                name.includes("32-bit") ||
                name.includes("v7a") ||
                name.includes("armeabi") ||
                (name.includes("arm") && !name.includes("arm64"))
            );
        }
    });
    if (bitMatch) return bitMatch;

    // 3. Fall back to universal APK
    const universalMatch = apkAssets.find((a) =>
        a.name.toLowerCase().includes("universal")
    );
    if (universalMatch) return universalMatch;

    // 4. Default to first APK
    return apkAssets[0];
}

/**
 * Compares two semver-like version strings (e.g. "1.10.0" vs "1.11.0").
 * Returns true if `latest` is strictly newer than `current`.
 */
export function isNewerVersion(current: string, latest: string): boolean {
    const clean = (v: string) => v.replace(/^v/, "").trim();
    const toNumbers = (v: string) => clean(v).split(".").map((n) => parseInt(n, 10) || 0);

    const cur = toNumbers(current);
    const lat = toNumbers(latest);
    const len = Math.max(cur.length, lat.length);

    for (let i = 0; i < len; i++) {
        const c = cur[i] ?? 0;
        const l = lat[i] ?? 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
}

/**
 * Fetches the latest GitHub release and compares it against the installed version.
 */
export async function checkForGithubUpdate(): Promise<UpdateInfo> {
    const currentVersion = Constants.expoConfig?.version ?? "1.0.0";

    const response = await fetch(RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
    }

    const release: GithubRelease = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, "");

    const available = isNewerVersion(currentVersion, latestVersion);
    const deviceArch = getDeviceArchitecture();

    // Find matching APK asset for mobile architecture
    const apkAsset = selectMatchingApkAsset(release.assets);

    return { available, release, apkAsset, currentVersion, latestVersion, deviceArch };
}

export interface DownloadApkResult {
    localUri: string;
}

/**
 * Downloads the APK from the given URL into the app cache directory,
 * reporting progress via onProgress (0–1).
 * Returns the local file URI.
 */
export async function downloadApk(
    downloadUrl: string,
    fileName: string,
    onProgress?: (progress: number) => void
): Promise<DownloadApkResult> {
    if (!FileSystem.cacheDirectory) {
        throw new Error("No cache directory available");
    }

    const localUri = `${FileSystem.cacheDirectory}${fileName}`;

    const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        localUri,
        {},
        (progress) => {
            const pct =
                progress.totalBytesExpectedToWrite > 0
                    ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
                    : 0;
            onProgress?.(pct);
        }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result?.uri) {
        throw new Error("Download failed — no URI returned");
    }

    return { localUri: result.uri };
}

/**
 * Opens the downloaded APK so Android can prompt the user to install it.
 * Requires the INSTALL_PACKAGES permission or side-loading to be enabled.
 */
export async function installApk(localUri: string): Promise<void> {
    if (Platform.OS !== "android") return;

    // expo-file-system/legacy returns file:// URIs — Android can open them directly
    const canOpen = await Linking.canOpenURL(localUri);
    if (canOpen) {
        await Linking.openURL(localUri);
    } else {
        // Fallback: strip file:// prefix for content scheme handling
        await Linking.openURL(localUri);
    }
}

/** Format bytes into a human-readable string (e.g. "24.3 MB") */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
