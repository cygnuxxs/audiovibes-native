import { useCallback } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { clampRatio, formatDisplayTime } from "@/lib/playerUtils";
import { useActiveColors } from "@/hooks/useActiveColors";

const THUMB_SIZE = 14;
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface PlayerSeekBarProps {
  positionSV: SharedValue<number>;
  durationSV: SharedValue<number>;
  sliderWidth: SharedValue<number>;
  isSeeking: SharedValue<boolean>;
  totalDuration: number;
  onSeek: (position: number) => void;
}

export function PlayerSeekBar({
  positionSV,
  durationSV,
  sliderWidth,
  isSeeking,
  totalDuration,
  onSeek,
}: PlayerSeekBarProps) {
  const activeColors = useActiveColors();
  const fg = activeColors["--foreground"];
  const primary = activeColors["--primary"];
  const border = activeColors["--border"];
  const mutedFg = activeColors["--muted-foreground"];

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      "worklet";
      isSeeking.value = true;
      const ratio = clampRatio(e.x / sliderWidth.value);
      positionSV.value = ratio * durationSV.value;
    })
    .onUpdate((e) => {
      "worklet";
      const ratio = clampRatio(e.x / sliderWidth.value);
      positionSV.value = ratio * durationSV.value;
    })
    .onEnd((e) => {
      "worklet";
      isSeeking.value = false;
      const ratio = clampRatio(e.x / sliderWidth.value);
      const finalPosition = ratio * durationSV.value;
      positionSV.value = finalPosition;
      runOnJS(onSeek)(finalPosition);
    });

  const onSliderLayout = useCallback(
    (e: any) => {
      sliderWidth.value = e.nativeEvent.layout.width || 1;
    },
    [sliderWidth]
  );

  const fillStyle = useAnimatedStyle(() => {
    const ratio = durationSV.value > 0 ? clampRatio(positionSV.value / durationSV.value) : 0;
    return { width: `${ratio * 100}%` };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const ratio = durationSV.value > 0 ? clampRatio(positionSV.value / durationSV.value) : 0;
    return {
      left: ratio * sliderWidth.value - THUMB_SIZE / 2,
      opacity: withTiming(isSeeking.value ? 1 : 0.6, { duration: 150 }),
      transform: [{ scale: withSpring(isSeeking.value ? 1.3 : 0.8) }],
    };
  });

  const animatedTimeProps = useAnimatedProps(() => {
    const timeText = formatDisplayTime(positionSV.value);
    return { text: timeText, defaultValue: timeText } as any;
  });

  return (
    <View className="mt-4 px-8">
      <GestureDetector gesture={panGesture}>
        <View onLayout={onSliderLayout} style={styles.sliderHitArea} collapsable={false}>
          {/* Track background */}
          <View style={[styles.sliderTrack, { backgroundColor: border }]}>
            {/* Filled portion uses --primary for theme accent */}
            <Animated.View style={[styles.sliderFill, { backgroundColor: primary }, fillStyle]} />
          </View>
          {/* Thumb — uses foreground color */}
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: fg,
                top: styles.sliderHitArea.paddingVertical - THUMB_SIZE / 2 + styles.sliderTrack.height / 2,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>

      <View className="flex-row justify-between mt-2">
        <AnimatedTextInput
          editable={false}
          animatedProps={animatedTimeProps}
          style={[styles.timeLabel, { color: mutedFg }]}
        />
        <Text
          className="text-[11px]"
          style={[styles.timeLabelBase, { color: mutedFg, opacity: 0.9 }]}
        >
          {formatDisplayTime(totalDuration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderHitArea: { paddingVertical: 12, marginVertical: -12 },
  sliderTrack: { height: 3, width: "100%", borderRadius: 2, overflow: "hidden" },
  sliderFill: { height: "100%", borderRadius: 2 },
  thumb: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  timeLabel: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    opacity: 0.9,
    padding: 0,
  },
  timeLabelBase: {
    fontVariant: ["tabular-nums"],
  },
});
