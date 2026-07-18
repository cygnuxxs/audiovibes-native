import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import { useShallow } from "zustand/react/shallow";
import { SearchX } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "./ui/text";

export default function EmptySongsState() {
  const { theme, mode } = useThemeStore(useShallow((state) => ({ theme: state.theme, mode: state.mode })));
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View className="bg-secondary p-6 rounded-full mb-8 border border-muted">
        <SearchX
          size={48}
          color={themes[theme][mode]["--muted-foreground"]}
          strokeWidth={1.5}
        />
      </View>

      <Text className="text-2xl font-extrabold text-foreground mb-3 text-center tracking-tight">
        The crowd goes silent.
      </Text>

      <Text className="text-base text-muted-foreground text-center mb-10 leading-6">
        We couldn&apos;t find any tracks, artists, or albums matching that vibe. Try
        a different search.
      </Text>
    </View>
  );
}
