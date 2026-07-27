import { View, Image, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Users } from "lucide-react-native";

interface PlayerArtistsSectionProps {
  artists: Artist[];
  fg: string;
  muted: string;
  border: string;
}

export function PlayerArtistsSection({ artists, fg, muted, border }: PlayerArtistsSectionProps) {
  if (artists.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={[styles.sectionDivider, { backgroundColor: border }]} />
      <View style={styles.sectionHeader}>
        <Users size={14} color={muted} strokeWidth={1.75} />
        <Text style={[styles.sectionTitle, { color: muted }]}>Artists</Text>
      </View>
      <View style={styles.artistsList}>
        {artists.map((artist, i) => (
          <View key={`${artist.id}-${artist.role ?? i}`} style={styles.artistRow}>
            {artist.image ? (
              <Image
                source={{ uri: artist.image.replace("-50x50", "-150x150") }}
                style={styles.artistAvatar}
              />
            ) : (
              <View
                style={[styles.artistAvatar, styles.artistAvatarPlaceholder, { backgroundColor: border }]}
              />
            )}
            <View style={styles.artistInfo}>
              <Text style={[styles.artistName, { color: fg }]} numberOfLines={1}>
                {artist.name}
              </Text>
              {artist.role ? (
                <Text style={[styles.artistRole, { color: muted }]} numberOfLines={1}>
                  {artist.role}
                </Text>
              ) : null}
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
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  artistsList: { gap: 12 },
  artistRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  artistAvatar: { width: 40, height: 40, borderRadius: 20 },
  artistAvatarPlaceholder: {},
  artistInfo: { flex: 1, gap: 2 },
  artistName: { fontSize: 14, fontWeight: "600" },
  artistRole: { fontSize: 11, opacity: 0.7, textTransform: "capitalize" },
});
