import { useCallback, useEffect } from "react";
import { View, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import TrackPlayer, { useActiveMediaItem, useIsPlaying, useProgress } from "@rntp/player";
import { useAudioStore } from "@/hooks/useAudioStore";
import { useActiveColors } from "@/hooks/useActiveColors";
import { Play, Pause } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

export default function FloatingPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useActiveColors();

  const activeMedia = useActiveMediaItem();
  const activeTrack = useAudioStore((s) => s.activeTrack);
  const isPlaying = useIsPlaying();
  const progress = useProgress(0.5);
  const rotation = useSharedValue(0);

  const displayMedia = activeMedia || activeTrack;

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 8000, easing: Easing.linear }),
        -1
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePlayPause = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (isPlaying) {
        TrackPlayer.pause();
      } else {
        TrackPlayer.play();
      }
    },
    [isPlaying]
  );

  const handleNext = useCallback((e: any) => {
    e.stopPropagation();
    TrackPlayer.skipToNext();
  }, []);

  if (!displayMedia) return null;

  const title = (displayMedia as any)?.title || "Unknown Title";
  const artist = (displayMedia as any)?.artist || "Unknown Artist";
  const artworkUrl = ((displayMedia as any)?.artworkUrl || (displayMedia as any)?.artwork) as string;

  const progressRatio =
    progress.duration > 0 ? Math.min(1, Math.max(0, progress.position / progress.duration)) : 0;

  const fg = colors["--foreground"];
  const mutedFg = colors["--muted-foreground"];
  const primary = colors["--primary"];
  const primaryFg = colors["--primary-foreground"];
  const cardBg = colors["--card"];
  const borderColor = colors["--border"];

  return (
    <Pressable
      onPress={() => router.push("/player")}
      className="absolute left-3 right-3 z-50 rounded-2xl border overflow-hidden shadow-lg"
      style={{
        bottom: insets.bottom + 8,
        backgroundColor: cardBg,
        borderColor: borderColor,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Now playing ${title} by ${artist}`}
    >
      {/* 1. Blurred Background Image */}
      {artworkUrl && (
        <Image
          source={{ uri: artworkUrl }}
          blurRadius={30}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
      )}

      {/* 2. Scrim overlay for high legibility across themes */}
      <View
        className="absolute inset-0 w-full h-full"
        style={{ backgroundColor: colors["--background"], opacity: 0.75 }}
      />

      {/* 3. Top Progress Line */}
      <View className="h-0.5 w-full overflow-hidden" style={{ backgroundColor: `${borderColor}66` }}>
        <View
          className="h-full"
          style={{
            width: `${progressRatio * 100}%`,
            backgroundColor: primary,
          }}
        />
      </View>

      {/* 4. Player Content Row */}
      <View className="flex-row items-center px-3 py-2.5">
        {/* Spinning Vinyl Artwork */}
        <Animated.View
          style={[animatedStyle, { borderColor: `${borderColor}88` }]}
          className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-black shadow-sm"
        >
          {artworkUrl ? (
            <Image source={{ uri: artworkUrl }} className="absolute h-full w-full" />
          ) : (
            <View className="h-full w-full bg-muted" />
          )}
          {/* Record Center Hole */}
          <View className="absolute h-3 w-3 rounded-full bg-black border border-white/30" />
        </Animated.View>

        {/* Track Title & Artist */}
        <View className="ml-3 flex-1 justify-center">
          <Text
            className="text-sm font-semibold tracking-tight"
            style={{ color: fg }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="text-xs font-medium"
            style={{ color: mutedFg }}
            numberOfLines={1}
          >
            {artist}
          </Text>
        </View>

        {/* Quick Action Controls */}
        <View className="flex-row items-center gap-2 ml-2">
          {/* Play/Pause Button */}
          <Pressable
            onPress={handlePlayPause}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-75"
            style={{ backgroundColor: primary }}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={16} color={primaryFg} fill={primaryFg} />
            ) : (
              <Play size={16} color={primaryFg} fill={primaryFg} style={{ marginLeft: 1 }} />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}