import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";

interface PlayerReleaseInfoProps {
  releaseDate?: string | null;
  copyright?: string;
  muted: string;
  border: string;
}

export function PlayerReleaseInfo({ releaseDate, copyright, muted, border }: PlayerReleaseInfoProps) {
  if (!releaseDate && !copyright) return null;

  return (
    <View style={styles.section}>
      <View style={[styles.sectionDivider, { backgroundColor: border }]} />
      {releaseDate && (
        <Text style={[styles.releaseDate, { color: muted }]}>Released · {releaseDate}</Text>
      )}
      {copyright && (
        <Text style={[styles.copyright, { color: muted }]} numberOfLines={3}>
          {copyright}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 32, paddingTop: 20 },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginBottom: 18, opacity: 0.4 },
  releaseDate: { fontSize: 12, opacity: 0.7, marginBottom: 6 },
  copyright: { fontSize: 11, opacity: 0.55, lineHeight: 17 },
});
