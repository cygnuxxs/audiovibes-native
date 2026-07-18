import { CirclePause, CirclePlayIcon, Loader2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, {
  SharedValue,
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useAudioStore } from "@/hooks/useAudioStore";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import WaveProgress from "./WaveProgress";
import { useActiveMediaItem, usePlaybackState, useProgress, PlaybackState, useIsPlaying } from "@rntp/player";

const PROGRESS_POLL_INTERVAL = 0.25; // 250ms interval in seconds

const SpinnerIcon = ({
  rotationDeg,
  color,
}: {
  rotationDeg: SharedValue<number>;
  color: string;
}) => {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDeg.value}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <Loader2 size={20} strokeWidth={1.5} color={color} />
    </Animated.View>
  );
};

interface PlayButtonProps {
  song: any;
  songUrl: string;
  songId: string;
  color: string;
  primaryColor: string;
}

export default function PlayButton({ song, songUrl, songId, color, primaryColor }: PlayButtonProps) {
  const toggle = useAudioStore((state) => state.toggle);
  const activeTrack = useActiveMediaItem();
  const playbackState = usePlaybackState();
  const isPlaying = useIsPlaying();
  const { position, duration } = useProgress(PROGRESS_POLL_INTERVAL);

  const isActive = (activeTrack as any)?.id === songId || (activeTrack as any)?.mediaId === songId;
  const isCurrentlyPlaying = isActive && isPlaying;
  const isCurrentlyLoading = isActive && playbackState === PlaybackState.Buffering;

  const validPosition = Number(position) || 0;
  const validDuration = Number(duration) || 0;

  const progress = useMemo(() => {
    if (!isActive || validDuration <= 0) return 0;
    return Math.max(0, Math.min(validPosition / validDuration, 1));
  }, [isActive, validPosition, validDuration]);

  const progressValue = useSharedValue(0);
  const playSpinnerRotation = useSharedValue(0);
  const [buttonSize, setButtonSize] = useState({ width: 0, height: 0 });

  const handleToggle = useCallback(() => {
    toggle({
      id: songId,
      url: songUrl,
      title: song.title,
      artist: song.music,
      artwork: song.image,
    });
  }, [toggle, songId, songUrl, song]);

  useEffect(() => {
    if (!isActive) {
      cancelAnimation(progressValue);
      progressValue.value = 0;
      return;
    }
    progressValue.value = withTiming(progress, {
      duration: PROGRESS_POLL_INTERVAL * 1000 + 10,
      easing: Easing.linear,
    });
  }, [isActive, progress, progressValue]);

  useEffect(() => {
    if (isCurrentlyLoading) {
      playSpinnerRotation.value = playSpinnerRotation.value % 360;
      playSpinnerRotation.value = withRepeat(
        withTiming(playSpinnerRotation.value + 360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(playSpinnerRotation);
      playSpinnerRotation.value = 0;
    }
  }, [isCurrentlyLoading, playSpinnerRotation]);



  const handleButtonLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setButtonSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);

  return (
    <Button
      variant="outline"
      onPress={handleToggle}
      onLayout={handleButtonLayout}
      className="relative h-12 w-1/2 overflow-hidden rounded-full"
    >
      <WaveProgress
        progressValue={progressValue}
        isPlaying={isCurrentlyPlaying}
        width={buttonSize.width}
        height={buttonSize.height}
        color={primaryColor}
      />

      <View
        pointerEvents="none"
        className="absolute inset-0 flex-row items-center justify-center gap-2"
      >
        {isCurrentlyLoading ? (
          <>
            <SpinnerIcon rotationDeg={playSpinnerRotation} color={color} />
            <Text className="font-semibold">Loading...</Text>
          </>
        ) : isCurrentlyPlaying ? (
          <>
            <CirclePause size={20} strokeWidth={1} color={color} />
            <Text className="font-semibold">Pause</Text>
          </>
        ) : (
          <>
            <CirclePlayIcon size={20} strokeWidth={1} color={color} />
            <Text className="font-semibold">Play</Text>
          </>
        )}
      </View>
    </Button>
  );
}
