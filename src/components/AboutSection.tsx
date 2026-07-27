import { useCallback, useState, useEffect, useRef } from "react";
import { View, Pressable, Linking, Animated, Easing } from "react-native";
import { toast } from "sonner-native";
import {
    Info,
    Code,
    RefreshCcw,
    ExternalLink,
    Download,
    CheckCircle,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import Constants from "expo-constants";
import { SettingsSection } from "./SettingsSection";
import GithubIcon from "@/assets/github.svg";
import { useActiveColors } from "@/hooks/useActiveColors";
import {
    checkForGithubUpdate,
    downloadApk,
    installApk,
    formatBytes,
    type UpdateInfo,
} from "@/lib/githubUpdate";

const DEVELOPER = {
    name: "Ashok Atragadda",
    handle: "@cygnuxxs",
    quote: "Talent is the skill to prove one's own ability",
    githubUrl: "https://github.com/cygnuxxs",
};

type UpdateStatus =
    | "idle"
    | "checking"
    | "up-to-date"
    | "update-available"
    | "downloading"
    | "done";

export function AboutSection() {
    const activeColors = useActiveColors();
    const appVersion = Constants.expoConfig?.version ?? "1.0.0";

    // ── state ──────────────────────────────────────────────────────────────
    const [status, setStatus] = useState<UpdateStatus>("idle");
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0); // 0–1
    const downloadProgressAnim = useRef(new Animated.Value(0)).current;

    // ── animations ─────────────────────────────────────────────────────────
    const [spinValue] = useState(() => new Animated.Value(0));
    const spinAnim = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (status === "checking" || status === "downloading") {
            spinAnim.current = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            spinAnim.current.start();
        } else {
            spinAnim.current?.stop();
            spinValue.setValue(0);
        }
        return () => spinAnim.current?.stop();
    }, [status, spinValue]);

    // Sync numeric progress to Animated.Value
    useEffect(() => {
        Animated.timing(downloadProgressAnim, {
            toValue: downloadProgress,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [downloadProgress, downloadProgressAnim]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    // ── helpers ────────────────────────────────────────────────────────────
    const isLoading = status === "checking" || status === "downloading";

    // ── check for updates ──────────────────────────────────────────────────
    const handleCheckUpdates = useCallback(async () => {
        if (isLoading) return;
        setStatus("checking");
        setUpdateInfo(null);
        setDownloadProgress(0);

        try {
            const info = await checkForGithubUpdate();
            setUpdateInfo(info);

            if (info.available) {
                setStatus("update-available");
                toast("Update available 🎉", {
                    description: `v${info.latestVersion} is ready to download.`,
                });
            } else {
                setStatus("up-to-date");
                toast.success("You're on the latest version");
                // Reset after 3 s
                setTimeout(() => setStatus("idle"), 3000);
            }
        } catch (e: any) {
            setStatus("idle");
            toast.error(e?.message ?? "Couldn't check for updates");
        }
    }, [isLoading]);

    // ── download & install APK ─────────────────────────────────────────────
    const handleDownloadUpdate = useCallback(async () => {
        if (!updateInfo?.apkAsset || isLoading) return;

        const { apkAsset, release } = updateInfo;
        const fileName = apkAsset.name || `audiovibes-${updateInfo.latestVersion}.apk`;

        setStatus("downloading");
        setDownloadProgress(0);

        try {
            const { localUri } = await downloadApk(
                apkAsset.browser_download_url,
                fileName,
                (progress) => setDownloadProgress(progress)
            );

            setDownloadProgress(1);
            setStatus("done");

            toast.success("Download complete! Installing…", {
                duration: 4000,
            });

            // Small delay so the toast is visible before the installer opens
            setTimeout(() => installApk(localUri), 800);
        } catch (e: any) {
            setStatus("update-available");
            toast.error(e?.message ?? "Download failed. Please try again.");
        }
    }, [updateInfo, isLoading]);

    // ── button label / icon logic ──────────────────────────────────────────
    const buttonLabel = {
        idle: "Check Updates",
        checking: "Checking…",
        "up-to-date": "Up to date",
        "update-available": `Download v${updateInfo?.latestVersion ?? ""}`,
        downloading: `${Math.round(downloadProgress * 100)}%`,
        done: "Installed!",
    }[status];

    const ButtonIcon = () => {
        if (status === "up-to-date")
            return <CheckCircle size={14} color={activeColors["--primary"]} />;
        if (status === "update-available" || status === "done")
            return <Download size={14} color={activeColors["--primary"]} />;
        return (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCcw size={14} color={activeColors["--primary"]} />
            </Animated.View>
        );
    };

    const handleButtonPress = () => {
        if (status === "update-available") return handleDownloadUpdate();
        if (status === "idle" || status === "up-to-date") return handleCheckUpdates();
    };

    return (
        <SettingsSection
            title="About"
            icon={<Info size={16} color={activeColors["--primary"]} />}
        >
            {/* Version & Update Action Row */}
            <View className="flex-row pt-auto items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                    <View className="p-2 rounded-lg bg-muted/50">
                        <Code size={18} color={activeColors["--primary"]} />
                    </View>
                    <View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-card-foreground font-medium text-sm">
                                App Version
                            </Text>
                            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                                <Text
                                    className="text-[10px] font-bold"
                                    style={{ color: activeColors["--primary"] }}
                                >
                                    v{appVersion}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                            Installed build
                        </Text>
                    </View>
                </View>

                {/* Update button */}
                <Pressable
                    onPress={handleButtonPress}
                    disabled={isLoading || status === "done"}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isLoading }}
                    accessibilityLabel="Check for app updates"
                    className={`flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/50 bg-card active:bg-muted/60 ${isLoading || status === "done" ? "opacity-60" : ""
                        }`}
                >
                    <ButtonIcon />
                    <Text
                        className="text-xs font-semibold"
                        style={{ color: activeColors["--primary"] }}
                    >
                        {buttonLabel}
                    </Text>
                </Pressable>
            </View>

            {/* ── Download progress bar ───────────────────────────────────── */}
            {(status === "downloading" || status === "done") && (
                <View className="px-4 pb-4">
                    {/* Rail */}
                    <View
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: activeColors["--muted"] }}
                    >
                        <Animated.View
                            style={{
                                height: "100%",
                                borderRadius: 999,
                                backgroundColor: activeColors["--primary"],
                                width: downloadProgressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0%", "100%"],
                                }),
                            }}
                        />
                    </View>

                    {/* Labels */}
                    <View className="flex-row justify-between mt-1.5">
                        <Text className="text-muted-foreground text-[10px]">
                            {status === "done"
                                ? "Download complete"
                                : updateInfo?.apkAsset
                                    ? `${formatBytes(
                                        Math.round(
                                            downloadProgress *
                                            updateInfo.apkAsset.size
                                        )
                                    )} / ${formatBytes(updateInfo.apkAsset.size)}`
                                    : "Downloading…"}
                        </Text>
                        <Text
                            className="text-[10px] font-semibold"
                            style={{ color: activeColors["--primary"] }}
                        >
                            {Math.round(downloadProgress * 100)}%
                        </Text>
                    </View>
                </View>
            )}

            {/* ── Release notes (when update is found) ───────────────────── */}
            {status === "update-available" &&
                updateInfo?.release?.body &&
                updateInfo.release.body.trim().length > 0 && (
                    <View className="mx-4 mb-4 p-3 rounded-xl border border-border/40 bg-muted/20">
                        <Text className="text-xs font-semibold text-card-foreground mb-1">
                            What's new in v{updateInfo.latestVersion}
                        </Text>
                        <Text
                            className="text-muted-foreground text-[11px] leading-5"
                            numberOfLines={6}
                        >
                            {updateInfo.release.body.trim()}
                        </Text>
                    </View>
                )}

            {/* Developer Profile Header */}
            <View className="items-center px-6 py-6 border-b border-border/40 bg-muted/10">
                <Text className="text-card-foreground font-semibold text-lg tracking-tight">
                    {DEVELOPER.name}
                </Text>
                <Text
                    className="text-xs font-medium mb-3"
                    style={{ color: activeColors["--primary"] }}
                >
                    {DEVELOPER.handle}
                </Text>

                {/* Quote Container */}
                <View className="bg-muted/40 px-4 py-2.5 rounded-xl border border-border/30 max-w-[90%]">
                    <Text className="text-muted-foreground text-xs italic text-center leading-relaxed">
                        &quot;{DEVELOPER.quote}&quot;
                    </Text>
                </View>
            </View>

            {/* GitHub Profile Action */}
            <Pressable
                onPress={() => Linking.openURL(DEVELOPER.githubUrl)}
                accessibilityRole="link"
                accessibilityLabel="Open GitHub profile in browser"
                className="flex-row items-center justify-between p-4 border-b border-border/40 active:bg-muted/40 transition-colors"
            >
                <View className="flex-row items-center gap-3">
                    <View className="p-2 rounded-lg bg-muted/50">
                        <GithubIcon
                            width={20}
                            height={20}
                            fill={activeColors["--foreground"]}
                            color={activeColors["--foreground"]}
                        />
                    </View>
                    <View>
                        <Text className="text-card-foreground font-medium text-sm">
                            GitHub Profile
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                            View repositories and code
                        </Text>
                    </View>
                </View>
                <ExternalLink size={16} color={activeColors["--muted-foreground"]} />
            </Pressable>
        </SettingsSection>
    );
}