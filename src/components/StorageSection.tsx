import { useCallback } from "react";
import { View, Pressable } from "react-native";
import { toast } from "sonner-native";
import { FolderOpen, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { StorageAccessFramework } from "expo-file-system/legacy";
import { SettingsSection } from "./SettingsSection";
import { useActiveColors } from "@/hooks/useActiveColors";
import { useDownloadStore } from "@/store/downloadStore";
import { formatDirectoryUri } from "@/lib/utils";

export function StorageSection() {
    const activeColors = useActiveColors();
    const downloadDirectoryUri = useDownloadStore((s) => s.downloadDirectoryUri);
    const setDownloadDirectoryUri = useDownloadStore((s) => s.setDownloadDirectoryUri);

    const handleChooseDirectory = useCallback(async () => {
        try {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
                setDownloadDirectoryUri(permissions.directoryUri);
                toast.success("Download folder updated");
            }
        } catch (e: any) {
            toast.error(e?.message ?? "Couldn't set the download folder");
        }
    }, [setDownloadDirectoryUri]);

    return (
        <SettingsSection
            title="Storage"
            icon={<FolderOpen size={16} color={activeColors["--primary"]} />}
        >
            {downloadDirectoryUri ? (
                <Pressable
                    onPress={handleChooseDirectory}
                    accessibilityRole="button"
                    accessibilityLabel="Change download folder"
                    className="flex-row items-center justify-between p-4 active:bg-muted/50"
                >
                    <View className="flex-1 mr-3">
                        <Text className="text-card-foreground font-medium mb-1">
                            Download Folder
                        </Text>
                        <View className="bg-muted/50 rounded-lg px-2.5 py-1.5 self-start max-w-full">
                            <Text
                                className="text-muted-foreground text-xs"
                                numberOfLines={1}
                                ellipsizeMode="middle"
                            >
                                {formatDirectoryUri(downloadDirectoryUri)}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={18} color={activeColors["--muted-foreground"]} />
                </Pressable>
            ) : (
                <View className="p-4">
                    <Text className="text-card-foreground font-medium mb-1">
                        Download Folder
                    </Text>
                    <Text className="text-muted-foreground text-sm mb-4">
                        Choose where downloaded files are saved on your device
                    </Text>
                    <Button
                        onPress={handleChooseDirectory}
                        accessibilityRole="button"
                        accessibilityLabel="Choose download folder"
                        className="flex-row items-center justify-center gap-2 rounded-xl active:opacity-80"
                    >
                        <FolderOpen size={18} color={activeColors["--primary-foreground"]} />
                        <Text className="text-primary-foreground font-bold">
                            Choose Folder
                        </Text>
                    </Button>
                </View>
            )}
        </SettingsSection>
    );
}