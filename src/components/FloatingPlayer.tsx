import React, { useEffect } from "react";
import { View, Pressable, Image, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { useActiveMediaItem, useIsPlaying } from "@rntp/player";
import { useAudioStore } from "@/hooks/useAudioStore";
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
  const activeMedia = useActiveMediaItem();
  const activeTrack = useAudioStore((s) => s.activeTrack);
  const isPlaying = useIsPlaying();
  const rotation = useSharedValue(0);

  const displayMedia = activeMedia || activeTrack;

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  if (!displayMedia) return null;

  // Cleanly extract properties so the JSX isn't cluttered with type casting
  const title = (displayMedia as any)?.title || "Unknown Title";
  const artist = (displayMedia as any)?.artist || "Unknown Artist";
  const artworkUrl = ((displayMedia as any)?.artworkUrl || (displayMedia as any)?.artwork) as string;

  return (
    <Pressable
      onPress={() => router.push("/player")}
      // Removed 'relative' and 'bg-card'. 
      // Added 'overflow-hidden' so the background image respects the rounded-2xl corners.
      className="absolute z-50 bottom-2 left-2 right-2 overflow-hidden rounded-2xl border border-border shadow-lg"
    >
      {/* 1. Blurred Background Image */}
      {artworkUrl && (
        <Image
          source={{ uri: artworkUrl }}
          blurRadius={25} // Increased blur for a smoother gradient effect
          style={StyleSheet.absoluteFill} // More reliable than inset-0 for RN Images
          resizeMode="cover"
        />
      )}

      {/* 2. Dark Overlay for text contrast */}
      <View style={StyleSheet.absoluteFill} className="bg-black/30" />

      {/* 3. Content Container (Added padding here instead of the parent Pressable) */}
      <View className="flex-row items-center p-3">

        {/* Spinning Record */}
        <Animated.View
          style={animatedStyle}
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black"
        >
          {artworkUrl && (
            <Image
              source={{ uri: artworkUrl }}
              className="absolute h-full w-full"
            />
          )}
          {/* Record Center Hole */}
          <View className="absolute h-3 w-3 rounded-full bg-black border border-white/20" />
        </Animated.View>

        {/* Text Info */}
        <View className="ml-3 flex-1">
          {/* Forced to white/gray so it contrasts perfectly with the dark overlay */}
          <Text className="text-base font-semibold text-white" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-sm text-gray-300" numberOfLines={1}>
            {artist}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}