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

const THUMB_SIZE = 14;
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface PlayerSeekBarProps {
  positionSV: SharedValue<number>;
  durationSV: SharedValue<number>;
  sliderWidth: SharedValue<number>;
  isSeeking: SharedValue<boolean>;
  totalDuration: number;
  fg: string;
  muted: string;
  border: string;
  onSeek: (position: number) => void;
}

export function PlayerSeekBar({
  positionSV,
  durationSV,
  sliderWidth,
  isSeeking,
  totalDuration,
  fg,
  muted,
  border,
  onSeek,
}: PlayerSeekBarProps) {
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
      opacity: withTiming(isSeeking.value ? 1 : 0, { duration: 150 }),
      transform: [{ scale: withSpring(isSeeking.value ? 1.2 : 0.6) }],
    };
  });

  const animatedTimeProps = useAnimatedProps(() => {
    const timeText = formatDisplayTime(positionSV.value);
    return { text: timeText, defaultValue: timeText } as any;
  });

  return (
    <View style={styles.seekSection}>
      <GestureDetector gesture={panGesture}>
        <View onLayout={onSliderLayout} style={styles.sliderHitArea} collapsable={false}>
          <View style={[styles.sliderTrack, { backgroundColor: border }]}>
            <Animated.View style={[styles.sliderFill, { backgroundColor: fg }, fillStyle]} />
          </View>
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

      <View style={styles.timeRow}>
        <AnimatedTextInput
          editable={false}
          animatedProps={animatedTimeProps}
          style={[styles.timeLabel, { color: muted }]}
        />
        <Text style={[styles.timeLabel, { color: muted }]}>
          {formatDisplayTime(totalDuration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seekSection: { marginTop: 20, paddingHorizontal: 32 },
  sliderHitArea: { paddingVertical: 12, marginVertical: -12 },
  sliderTrack: { height: 2, width: "100%", borderRadius: 1, overflow: "hidden" },
  sliderFill: { height: "100%", borderRadius: 1 },
  thumb: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  timeLabel: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    opacity: 0.9,
    padding: 0,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
