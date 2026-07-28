import { useState, useCallback } from "react";
import { View, Image, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Users } from "lucide-react-native";
import { useActiveColors } from "@/hooks/useActiveColors";

interface PlayerArtistsSectionProps {
  artists: Artist[];
  onArtistPress?: (artist: Artist) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ArtistAvatar({ artist, colors }: { artist: Artist; colors: Record<string, string> }) {
  const [failed, setFailed] = useState(false);

  if (!artist.image || failed) {
    return (
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: colors["--primary"] }}
      >
        <Text
          className="text-sm font-bold"
          style={{ color: colors["--primary-foreground"] }}
        >
          {getInitials(artist.name) || "?"}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: artist.image.replace("-50x50", "-150x150") }}
      className="w-10 h-10 rounded-full"
      style={{ backgroundColor: colors["--border"] }}
      resizeMode="cover"
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

export function PlayerArtistsSection({ artists, onArtistPress }: PlayerArtistsSectionProps) {
  const colors = useActiveColors();
  const sectionLabelColor = colors["--muted-foreground"];
  const nameColor = colors["--foreground"];
  const roleColor = colors["--muted-foreground"];
  const dividerColor = colors["--border"];
  const iconColor = colors["--primary"];

  if (artists.length === 0) return null;

  return (
    <View className="px-8 pt-5">
      {/* Divider */}
      <View
        className="h-px mb-4"
        style={{ backgroundColor: dividerColor, opacity: 0.5 }}
      />

      <View className="flex-row items-center gap-1.5 mb-3.5">
        <Users size={13} color={iconColor} strokeWidth={2} />
        <Text
          className="text-[11px] font-bold tracking-widest uppercase"
          style={{ color: sectionLabelColor }}
        >
          {artists.length > 1 ? "Artists" : "Artist"}
        </Text>
      </View>

      <View className="gap-3">
        {artists.map((artist, i) => {
          const key = `${artist.id}-${artist.role ?? i}`;
          const content = (
            <View className="flex-row items-center gap-3">
              <ArtistAvatar artist={artist} colors={colors} />
              <View className="flex-1 gap-0.5">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: nameColor }}
                  numberOfLines={1}
                >
                  {artist.name}
                </Text>
                {artist.role ? (
                  <Text
                    className="text-[11px] capitalize"
                    style={{ color: roleColor, opacity: 0.7 }}
                    numberOfLines={1}
                  >
                    {artist.role}
                  </Text>
                ) : null}
              </View>
            </View>
          );

          if (!onArtistPress) {
            return <View key={key}>{content}</View>;
          }

          return (
            <Pressable
              key={key}
              onPress={() => onArtistPress(artist)}
              accessibilityRole="button"
              accessibilityLabel={`View ${artist.name}${artist.role ? `, ${artist.role}` : ""}`}
              hitSlop={4}
              className="active:opacity-60"
            >
              {content}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
