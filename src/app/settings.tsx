import { View, Pressable, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActiveColors } from "@/hooks/useActiveColors";
import { AppearanceSection } from "@/components/AppearanceSection";
import { StorageSection } from "@/components/StorageSection";
import { AboutSection } from "@/components/AboutSection";
import { PerformanceSection } from "@/components/PerformanceSection";

export default function SettingsScreen() {
  const router = useRouter();
  const activeColors = useActiveColors();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View className="px-4 py-3 w-full bg-background flex-row items-center border-b border-border/60">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3 p-2 rounded-full active:bg-muted active:opacity-80"
        >
          <ArrowLeft color={activeColors["--foreground"]} size={24} />
        </Pressable>
        <Text className="font-bold text-2xl text-foreground">Settings</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AppearanceSection />
        <StorageSection />
        <PerformanceSection />
        <AboutSection />
      </ScrollView>
    </SafeAreaView>
  );
}