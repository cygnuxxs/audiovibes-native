import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";

const SKELETON_COUNT = 4;

const ShimmerBlock = ({
  width,
  height,
  borderRadius = 8,
  shimmerAnim,
  mutedColor,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  shimmerAnim: Animated.Value;
  mutedColor: string;
}) => {
  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View
      style={{
        width: width as number,
        height,
        borderRadius,
        backgroundColor: mutedColor,
        opacity,
      }}
    />
  );
};

const SkeletonCard = ({
  shimmerAnim,
  mutedColor,
}: {
  shimmerAnim: Animated.Value;
  mutedColor: string;
}) => (
  <View className="border bg-background dark:bg-muted border-muted-foreground/20 mb-4 rounded-4xl p-2 gap-2 overflow-hidden">
    <View className="flex-row items-center gap-2">
      {/* Image placeholder */}
      <ShimmerBlock
        width={120}
        height={120}
        borderRadius={20}
        shimmerAnim={shimmerAnim}
        mutedColor={mutedColor}
      />

      <View className="flex-1 gap-3">
        {/* Title */}
        <ShimmerBlock
          width="80%"
          height={20}
          borderRadius={6}
          shimmerAnim={shimmerAnim}
          mutedColor={mutedColor}
        />

        {/* Album */}
        <ShimmerBlock
          width="60%"
          height={14}
          borderRadius={6}
          shimmerAnim={shimmerAnim}
          mutedColor={mutedColor}
        />

        {/* Artist row */}
        <View className="flex-row items-center gap-2">
          <ShimmerBlock
            width={40}
            height={40}
            borderRadius={20}
            shimmerAnim={shimmerAnim}
            mutedColor={mutedColor}
          />
          <ShimmerBlock
            width={80}
            height={12}
            borderRadius={6}
            shimmerAnim={shimmerAnim}
            mutedColor={mutedColor}
          />
        </View>

        {/* Info row */}
        <View className="flex-row gap-3">
          <ShimmerBlock
            width={50}
            height={12}
            borderRadius={6}
            shimmerAnim={shimmerAnim}
            mutedColor={mutedColor}
          />
          <ShimmerBlock
            width={50}
            height={12}
            borderRadius={6}
            shimmerAnim={shimmerAnim}
            mutedColor={mutedColor}
          />
          <ShimmerBlock
            width={40}
            height={12}
            borderRadius={6}
            shimmerAnim={shimmerAnim}
            mutedColor={mutedColor}
          />
        </View>
      </View>
    </View>

    {/* Action bar placeholder */}
    <ShimmerBlock
      width="100%"
      height={40}
      borderRadius={20}
      shimmerAnim={shimmerAnim}
      mutedColor={mutedColor}
    />
  </View>
);

const SongCardSkeleton = () => {
  const { theme, mode } = useThemeStore(useShallow((state) => ({ theme: state.theme, mode: state.mode })));
  const mutedColor = themes[theme][mode]["--muted-foreground"];
  const shimmerAnim = useRef(new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim.current, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <ScrollView className="px-1">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SkeletonCard key={i} shimmerAnim={shimmerAnim.current} mutedColor={mutedColor} />
      ))}
    </ScrollView>
  );
};

export default SongCardSkeleton;
