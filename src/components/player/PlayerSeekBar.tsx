import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withSpring,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { clampRatio, formatDisplayTime } from "@/lib/playerUtils";
import { useActiveColors } from "@/hooks/useActiveColors";
import { useAudioStore } from "@/hooks/useAudioStore";

const THUMB_SIZE = 14;

interface PlayerSeekBarProps {
  currentPosition: number;
  totalDuration: number;
  onSeek: (position: number) => void;
}

export function PlayerSeekBar({
  currentPosition,
  totalDuration,
  onSeek,
}: PlayerSeekBarProps) {
  const activeColors = useActiveColors();
  const fg = activeColors["--foreground"];
  const primary = activeColors["--primary"];
  const border = activeColors["--border"];
  const mutedFg = activeColors["--muted-foreground"];

  const storePosition = useAudioStore((s) => s.position);
  const storeDuration = useAudioStore((s) => s.duration);

  const sliderWidth = useSharedValue(1);
  const isSeeking = useSharedValue(false);
  const seekPositionSV = useSharedValue(currentPosition);
  const durationSV = useSharedValue(
    storeDuration > 0 ? storeDuration : totalDuration
  );

  // Fixes the original freeze: worklets now always read a live duration
  // instead of a stale closed-over `totalDuration` prop.
  useEffect(() => {
    const nextDuration = storeDuration > 0 ? storeDuration : totalDuration;
    if (nextDuration > 0) {
      durationSV.value = nextDuration;
    }
  }, [storeDuration, totalDuration]);

  useEffect(() => {
    if (isSeeking.value) return;
    const pos = storePosition > 0 ? storePosition : currentPosition;
    seekPositionSV.value = pos;
  }, [currentPosition, storePosition]);

  const ratioSV = useDerivedValue(() => {
    const dur = durationSV.value > 0 ? durationSV.value : 1;
    return clampRatio(seekPositionSV.value / dur);
  });

  const [displayPosition, setDisplayPosition] = useState(currentPosition);
  useAnimatedReaction(
    () => seekPositionSV.value,
    (pos, prevPos) => {
      if (prevPos === null || Math.abs(pos - prevPos) >= 0.2) {
        scheduleOnRN(setDisplayPosition, pos);
      }
    },
    []
  );

  const handleSeekEnd = useCallback(
    (finalPos: number) => {
      onSeek(finalPos);
    },
    [onSeek]
  );

  const updateSeekFromX = (x: number) => {
    "worklet";
    const width = sliderWidth.value > 0 ? sliderWidth.value : 1;
    const dur = durationSV.value > 0 ? durationSV.value : 1;
    const ratio = clampRatio(x / width);
    seekPositionSV.value = ratio * dur;
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      "worklet";
      isSeeking.value = true;
      updateSeekFromX(e.x);
    })
    .onUpdate((e) => {
      "worklet";
      updateSeekFromX(e.x);
    })
    .onEnd((e) => {
      "worklet";
      updateSeekFromX(e.x);
      isSeeking.value = false;
      scheduleOnRN(handleSeekEnd, seekPositionSV.value);
    })
    .onFinalize(() => {
      "worklet";
      isSeeking.value = false;
    });

  const tapGesture = Gesture.Tap()
    .onBegin((e) => {
      "worklet";
      isSeeking.value = true;
      updateSeekFromX(e.x);
    })
    .onEnd((e) => {
      "worklet";
      updateSeekFromX(e.x);
      isSeeking.value = false;
      scheduleOnRN(handleSeekEnd, seekPositionSV.value);
    })
    .onFinalize(() => {
      "worklet";
      isSeeking.value = false;
    });

  const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const onSliderLayout = useCallback(
    (e: any) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0) {
        sliderWidth.value = w;
      }
    },
    [sliderWidth]
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${ratioSV.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const width = sliderWidth.value > 0 ? sliderWidth.value : 1;
    return {
      left: ratioSV.value * width - THUMB_SIZE / 2,
      opacity: withTiming(isSeeking.value ? 1 : 0.6, { duration: 150 }),
      transform: [{ scale: withSpring(isSeeking.value ? 1.3 : 0.8) }],
    };
  });

  return (
    <View className="mt-4 px-8">
      <GestureDetector gesture={combinedGesture}>
        <View onLayout={onSliderLayout} style={styles.sliderHitArea} collapsable={false}>
          <View style={[styles.sliderTrack, { backgroundColor: border }]}>
            <Animated.View style={[styles.sliderFill, { backgroundColor: primary }, fillStyle]} />
          </View>
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: fg,
                top:
                  styles.sliderHitArea.paddingVertical -
                  THUMB_SIZE / 2 +
                  styles.sliderTrack.height / 2,
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
        <Text style={[styles.timeLabel, { color: mutedFg }]}>
          {formatDisplayTime(displayPosition)}
        </Text>
        <Text
          className="text-[11px]"
          style={[styles.timeLabelBase, { color: mutedFg, opacity: 0.9 }]}
        >
          {formatDisplayTime(storeDuration > 0 ? storeDuration : totalDuration)}
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
