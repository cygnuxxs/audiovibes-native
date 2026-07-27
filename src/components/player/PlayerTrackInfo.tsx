import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";

interface PlayerTrackInfoProps {
  title: string;
  artist: string;
  composer?: string;
  fg: string;
  muted: string;
}

export function PlayerTrackInfo({ title, artist, composer, fg, muted }: PlayerTrackInfoProps) {
  return (
    <View style={styles.metadata}>
      <Text style={[styles.trackTitle, { color: fg }]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[styles.trackArtist, { color: muted }]} numberOfLines={1}>
        {artist}
      </Text>
      {composer && composer !== artist && (
        <Text style={[styles.trackComposer, { color: muted }]} numberOfLines={1}>
          Composed by {composer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  metadata: { paddingHorizontal: 32, paddingTop: 24, gap: 4 },
  trackTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  trackArtist: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  trackComposer: {
    fontSize: 12,
    fontWeight: "400",
    opacity: 0.7,
    marginTop: 2,
  },
});
