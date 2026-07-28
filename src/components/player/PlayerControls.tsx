import { View, Pressable } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { useActiveColors } from "@/hooks/useActiveColors";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function PlayerControls({ isPlaying, onPlayPause }: PlayerControlsProps) {
  const colors = useActiveColors();
  const primary = colors["--primary"];
  const primaryFg = colors["--primary-foreground"];
  const mutedFg = colors["--muted-foreground"];

  return (
    <View className="flex-row items-center justify-center gap-10 px-8 mt-6 mb-2">
      {/* Play / Pause — primary themed */}
      <Pressable
        onPress={onPlayPause}
        className="w-16 h-16 rounded-full items-center justify-center active:opacity-80"
        style={{
          backgroundColor: primary,
          shadowColor: primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 12,
          elevation: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause size={24} color={primaryFg} fill={primaryFg} />
        ) : (
          <Play size={24} color={primaryFg} fill={primaryFg} style={{ marginLeft: 2 }} />
        )}
      </Pressable>
    </View>
  );
}
