import { View, Image, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { useActiveColors } from "@/hooks/useActiveColors";

const { width } = Dimensions.get("window");
const ARTWORK_SIZE = width - 64;

interface PlayerArtworkProps {
  artworkUri?: string;
  isExplicit: boolean;
}

export function PlayerArtwork({ artworkUri, isExplicit }: PlayerArtworkProps) {
  const colors = useActiveColors();

  return (
    <View className="items-center px-8 pt-3 pb-4">
      <View
        className="rounded-2xl overflow-hidden"
        style={{
          width: ARTWORK_SIZE,
          height: ARTWORK_SIZE,
          shadowColor: colors["--foreground"],
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.55,
          shadowRadius: 28,
          elevation: 20,
        }}
      >
        {artworkUri ? (
          <Image source={{ uri: artworkUri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full bg-muted" />
        )}
      </View>

      {isExplicit && (
        <View
          className="absolute bottom-6 right-10 rounded px-1.5 py-0.5"
          style={{ backgroundColor: `${colors["--primary-foreground"]}26` }}
        >
          <Text
            className="text-[10px] font-bold tracking-wide"
            style={{ color: colors["--primary-foreground"] }}
          >
            E
          </Text>
        </View>
      )}
    </View>
  );
}
