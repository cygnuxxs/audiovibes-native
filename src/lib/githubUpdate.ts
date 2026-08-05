import { File, Paths } from "expo-file-system";
import { Platform, AppState } from "react-native";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { apkInstaller } from "@cygnuxxs/apkinstaller";

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
    };

    const supportedAbis = platformConstants.SUPPORTED_ABIS || [];
    const supported64 = platformConstants.SUPPORTED_64_BIT_ABIS || [];

    let primaryAbi = supportedAbis[0] || "";

    if (!primaryAbi && Constants.systemArchitectures) {
        primaryAbi = Array.isArray(Constants.systemArchitectures)
            ? Constants.systemArchitectures[0] || ""
            : typeof Constants.systemArchitectures === "string"
              ? Constants.systemArchitectures
              : "";
    }

    // "64" covers arm64, aarch64, x86_64 — no separate checks needed
    const is64Bit = supported64.length > 0 || primaryAbi.toLowerCase().includes("64");

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
 * Normalizes a version string for comparison:
 * - trims whitespace
 * - strips a leading "v"/"V" (e.g. "v1.2.0" -> "1.2.0")
 * - drops pre-release/build metadata (e.g. "1.2.0-rc.1" -> "1.2.0", "1.2.0+42" -> "1.2.0")
 */
export function normalizeVersion(v: string | null | undefined): string {
    if (!v) return "0.0.0";
    return v.trim().replace(/^[vV]/, "").split(/[-+]/)[0];
}

const toSegments = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);

/**
 * Compares two semver-like version strings (e.g. "1.10.0" vs "1.11.0").
 * Returns true if `latest` is strictly newer than `current`.
 * Versions are normalized before comparing, so "v1.2.0", "1.2.0", and
 * "1.2.0+build" are all treated as equal.
 *
 * If `preNormalized` is true, skips redundant normalizeVersion calls —
 * use when caller already normalized both strings.
 */
export function isNewerVersion(
    current: string,
    latest: string,
    preNormalized = false
): boolean {
    const normCurrent = preNormalized ? current : normalizeVersion(current);
    const normLatest = preNormalized ? latest : normalizeVersion(latest);

    if (normCurrent === normLatest) return false;

    const cur = toSegments(normCurrent);
    const lat = toSegments(normLatest);
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
 * Resolves the currently installed app version.
 * Prefers `expo-application`'s nativeApplicationVersion, which reliably
 * reflects the version baked into standalone/production builds.
 * Falls back to Constants.expoConfig?.version (more reliable in dev/Expo Go),
 * then to the provided override, then to "1.0.0".
 */
export function getCurrentAppVersion(override?: string): string {
    if (override) return override;

    const nativeVersion = Application.nativeApplicationVersion;
    if (nativeVersion) return nativeVersion;

    const expoConfigVersion = Constants.expoConfig?.version;
    if (expoConfigVersion) return expoConfigVersion;

    return "1.0.0";
}

/**
 * Fetches the latest GitHub release and compares it against the installed version.
 */
export async function checkForGithubUpdate(
    currentVersion?: string
): Promise<UpdateInfo> {
    const resolvedCurrentVersion = getCurrentAppVersion(currentVersion);

    const response = await fetch(RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
    }

    const release: GithubRelease = await response.json();
    const latestVersion = normalizeVersion(release.tag_name);
    const normalizedCurrent = normalizeVersion(resolvedCurrentVersion);

    // Already normalized — skip redundant work inside isNewerVersion
    const available = isNewerVersion(normalizedCurrent, latestVersion, true);

    return {
        available,
        release,
        apkAsset: selectMatchingApkAsset(release.assets),
        currentVersion: normalizedCurrent,
        latestVersion,
        deviceArch: getDeviceArchitecture(),
    };
}

export interface DownloadApkResult {
    localUri: string;
    isCached: boolean;
}

/**
 * Validates cached file size matches expected bytes (if provided).
 */
function isCacheSizeValid(file: File, expectedBytes?: number): boolean {
    return !expectedBytes || expectedBytes <= 0 || !file.size || file.size === expectedBytes;
}

/**
 * Checks whether an APK with the given filename is already cached.
 */
export function isApkCached(fileName: string, expectedBytes?: number): boolean {
    try {
        const destination = new File(Paths.cache, fileName);
        return destination.exists && isCacheSizeValid(destination, expectedBytes);
    } catch {
        return false;
    }
}

/**
 * Clears cached APK file if it exists.
 */
export function clearCachedApk(fileName: string): void {
    try {
        const file = new File(Paths.cache, fileName);
        if (file.exists) {
            file.delete();
        }
    } catch {
        // Ignore deletion errors
    }
}

/**
 * Downloads the APK from the given URL into the app cache directory,
 * reporting progress via onProgress (0–1).
 * If the file is already downloaded in cache, reuses it.
 * Returns the local file URI and whether it was loaded from cache.
 */
export async function downloadApk(
    downloadUrl: string,
    fileName: string,
    onProgress?: (progress: number) => void,
    expectedBytes?: number
): Promise<DownloadApkResult> {
    const destination = new File(Paths.cache, fileName);

    if (destination.exists) {
        if (isCacheSizeValid(destination, expectedBytes)) {
            onProgress?.(1);
            return { localUri: destination.uri, isCached: true };
        }

        try {
            destination.delete();
        } catch {
            // Ignore stale cache cleanup failures
        }
    }

    const downloadTask = File.createDownloadTask(downloadUrl, destination, {
        onProgress: ({ bytesWritten, totalBytes }: { bytesWritten: number; totalBytes: number }) => {
            const totalExpectedBytes = totalBytes > 0 ? totalBytes : expectedBytes ?? 0;

            const pct =
                totalExpectedBytes > 0
                    ? Math.min(1, Math.max(0, bytesWritten / totalExpectedBytes))
                    : 0;

            onProgress?.(pct);
        },
    });

    const result = await downloadTask.downloadAsync();

    if (!result) {
        throw new Error("Download failed — no URI returned");
    }

    return { localUri: result.uri, isCached: false };
}

export interface InstallApkOptions {
    onAutoInstallSuccess?: () => void;
    onAutoInstallError?: (error: any) => void;
}

let pendingInstallUri: string | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export function clearPendingInstall(): void {
    pendingInstallUri = null;
    if (appStateSubscription) {
        appStateSubscription.remove();
        appStateSubscription = null;
    }
}

/**
 * Opens the downloaded APK so Android can prompt the user to install it.
 * Requires the INSTALL_PACKAGES permission or side-loading to be enabled.
 * If permission is missing, opens Install Settings and automatically redirects
 * back to installation when user returns to the app.
 * Returns true if installer opened directly, false if permissions needed or suppressed.
 */
export async function installApk(
    localUri: string,
    options?: InstallApkOptions
): Promise<boolean> {
    if (Platform.OS !== "android") return false;

    try {
        await apkInstaller.apkInstall(localUri);
        clearPendingInstall();
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes("unknown apps") || lowerMessage.includes("not allowed")) {
            clearPendingInstall();
            pendingInstallUri = localUri;


            appStateSubscription = AppState.addEventListener("change", async (nextState) => {
                if (nextState === "active" && pendingInstallUri) {
                    const uriToInstall = pendingInstallUri;
                    clearPendingInstall();

                    try {
                        await apkInstaller.apkInstall(uriToInstall);
                        options?.onAutoInstallSuccess?.();
                    } catch (err) {
                        options?.onAutoInstallError?.(err);
                    }
                }
            });

            try {
                await apkInstaller.openInstallSettings();
            } catch {
                // Suppress settings open errors
            }
            return false;
        }

        // Suppress any non-fatal native module error logs since installer intent is handled
        return false;
    }
}

/** Format bytes into a human-readable string (e.g. "24.3 MB") */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}