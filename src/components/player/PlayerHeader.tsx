import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { ChevronDown } from "lucide-react-native";

interface PlayerHeaderProps {
  fg: string;
  onBack: () => void;
}

export function PlayerHeader({ fg, onBack }: PlayerHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.headerBtn} hitSlop={12}>
        <ChevronDown size={22} color={fg} strokeWidth={1.75} />
      </Pressable>
      <Text style={styles.headerLabel}>Now Playing</Text>
      <View style={styles.headerBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
