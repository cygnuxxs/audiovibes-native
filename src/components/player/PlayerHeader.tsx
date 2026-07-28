import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { ChevronDown } from "lucide-react-native";
import { useActiveColors } from "@/hooks/useActiveColors";

interface PlayerHeaderProps {
  onBack: () => void;
}

export function PlayerHeader({ onBack }: PlayerHeaderProps) {
  const colors = useActiveColors();
  const iconColor = colors["--primary-foreground"];

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <Pressable onPress={onBack} className="w-9 h-9 items-center justify-center" hitSlop={12}>
        <ChevronDown size={22} color={iconColor} strokeWidth={2} />
      </Pressable>
      <Text
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: iconColor, opacity: 0.85 }}
      >
        Now Playing
      </Text>
      <View className="w-9 h-9" />
    </View>
  );
}
