import { View } from "react-native";
import { Text } from "@/components/ui/text";

type SettingsSectionProps = {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Shared card wrapper used by every settings group so spacing,
 * corner radius, and the title row stay identical across sections.
 */
export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
    return (
        <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3 px-1">
                {icon}
                <Text className="font-bold text-base text-primary dark:text-foreground">
                    {title}
                </Text>
            </View>
            <View className="bg-card rounded-2xl border border-border shadow-sm shadow-black/5 overflow-hidden">
                {children}
            </View>
        </View>
    );
}