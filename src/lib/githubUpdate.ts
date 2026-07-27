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

    // Find an APK asset (Android only)
    const apkAsset = release.assets.find(
        (a) =>
            a.name.endsWith(".apk") ||
            a.content_type === "application/vnd.android.package-archive"
    );

    return { available, release, apkAsset, currentVersion, latestVersion };
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
