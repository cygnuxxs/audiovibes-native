import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useActiveColors } from "@/hooks/useActiveColors";

interface PlayerTrackInfoProps {
  title: string;
  artist: string;
  composer?: string;
}

export function PlayerTrackInfo({ title, artist, composer }: PlayerTrackInfoProps) {
  const colors = useActiveColors();
  const showComposer = composer && composer !== artist;

  return (
    <View className="mx-8 mt-5 mb-2 items-center gap-1">
      <Text
        className="text-2xl font-bold tracking-tight leading-tight text-center"
        style={{ color: colors["--foreground"] }}
        numberOfLines={2}
      >
        {title}
      </Text>

      <Text
        className="text-base font-medium text-center"
        style={{ color: colors["--muted-foreground"] }}
        numberOfLines={1}
      >
        {artist}
      </Text>

      {showComposer && (
        <View className="flex-row items-center gap-1.5 mt-1">
          <Text
            className="text-xs font-normal"
            style={{ color: colors["--muted-foreground"], opacity: 0.6 }}
          >
            Composer
          </Text>
          <View
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: colors["--muted-foreground"], opacity: 0.4 }}
          />
          <Text
            className="text-xs font-normal flex-1 text-center"
            style={{ color: colors["--muted-foreground"], opacity: 0.75 }}
            numberOfLines={1}
          >
            {composer}
          </Text>
        </View>
      )}
    </View>
  );
}
