import { View, Image, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";

const { width } = Dimensions.get("window");
const ARTWORK_SIZE = width - 64;

interface PlayerArtworkProps {
  artworkUri?: string;
  isExplicit: boolean;
}

export function PlayerArtwork({ artworkUri, isExplicit }: PlayerArtworkProps) {
  return (
    <View style={styles.artworkWrapper}>
      <View style={[styles.artworkContainer, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}>
        {artworkUri ? (
          <Image source={{ uri: artworkUri }} style={styles.artworkImage} />
        ) : (
          <View style={[styles.artworkImage, styles.artworkPlaceholder]} />
        )}
      </View>
      {isExplicit && (
        <View style={styles.explicitBadge}>
          <Text style={styles.explicitText}>E</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  artworkWrapper: { alignItems: "center", paddingHorizontal: 32, paddingTop: 12 },
  artworkContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  artworkImage: { width: "100%", height: "100%" },
  artworkPlaceholder: { backgroundColor: "#1a1a1a" },
  explicitBadge: {
    position: "absolute",
    bottom: 10,
    right: 42,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  explicitText: { fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
});
