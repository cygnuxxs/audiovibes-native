import { View, Pressable, StyleSheet } from "react-native";
import { Play, Pause } from "lucide-react-native";

interface PlayerControlsProps {
  isPlaying: boolean;
  fg: string;
  border: string;
  onPlayPause: () => void;
}

export function PlayerControls({ isPlaying, fg, border, onPlayPause }: PlayerControlsProps) {
  return (
    <View style={styles.controls}>
      <Pressable onPress={onPlayPause} style={[styles.playBtn, { borderColor: border }]}>
        {isPlaying ? (
          <Pause size={24} color={fg} fill={fg} />
        ) : (
          <Play size={24} color={fg} fill={fg} style={{ marginLeft: 2 }} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
