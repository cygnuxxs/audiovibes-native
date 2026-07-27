import { View } from "react-native";
import { Palette } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import ModeToggler from "@/components/ModeToggler";
import ThemeSelector from "@/components/ThemeSelector";
import { SettingsSection } from "./SettingsSection";
import { useActiveColors } from "@/hooks/useActiveColors";

export function AppearanceSection() {
    const activeColors = useActiveColors();

    return (
        <SettingsSection
            title="Appearance"
            icon={<Palette size={16} color={activeColors["--primary"]} />}
        >
            <View className="flex-row items-center justify-between p-4">
                <View className="flex-1 pr-3">
                    <Text className="text-card-foreground font-medium mb-0.5">
                        Theme & Mode
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                        Pick a color palette and light or dark mode
                    </Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <ModeToggler />
                    <ThemeSelector />
                </View>
            </View>
        </SettingsSection>
    );
}