import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";

interface Chip {
  icon: any;
  label: string;
  value: string;
}

interface PlayerInfoChipsProps {
  chips: Chip[];
  fg: string;
  muted: string;
  border: string;
}

export function PlayerInfoChips({ chips, fg, muted, border }: PlayerInfoChipsProps) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={[styles.sectionDivider, { backgroundColor: border }]} />
      <View style={styles.chipsGrid}>
        {chips.map((chip) => (
          <View
            key={chip.label}
            style={[styles.chip, { borderColor: border, backgroundColor: "rgba(255,255,255,0.06)" }]}
          >
            <chip.icon size={13} color={muted} strokeWidth={1.75} />
            <View style={styles.chipText}>
              <Text style={[styles.chipLabel, { color: muted }]}>{chip.label}</Text>
              <Text style={[styles.chipValue, { color: fg }]} numberOfLines={1}>
                {chip.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 32, paddingTop: 20 },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginBottom: 18, opacity: 0.4 },
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: "45%",
    flex: 1,
  },
  chipText: { flex: 1, gap: 1 },
  chipLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.8,
  },
  chipValue: { fontSize: 13, fontWeight: "600" },
});
