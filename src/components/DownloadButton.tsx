import { DownloadIcon, Loader2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Alert, ToastAndroid, Platform } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import WaveProgress from "./WaveProgress";
import { downloadRawSongAndArtCover, writeMetadataAndArtCover } from "@/lib/download";

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

interface DownloadButtonProps {
  song: Song;
  color: string;
  primaryColor: string;
}

export default function DownloadButton({ song, color, primaryColor }: DownloadButtonProps) {
  const downloadSpinnerRotation = useSharedValue(0);
  const downloadProgressValue = useSharedValue(0);

  const [downloadButtonSize, setDownloadButtonSize] = useState({ width: 0, height: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    downloadProgressValue.value = withTiming(downloadProgress, {
      duration: 500,
      easing: Easing.linear,
    });
  }, [downloadProgress, downloadProgressValue]);

  const handleDownload = useCallback(async () => {
    if (!song || isDownloading || isDownloaded) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const result = await downloadRawSongAndArtCover(
        song.image.replace("-50x50", "-500x500"),
        song.downloadUrl,
        (p) => {
          if (p >= 0 && p <= 1) setDownloadProgress(p);
        }
      );

      if (result.success && result.songUri && result.imageUri) {
        setDownloadProgress(1);
        await writeMetadataAndArtCover(result.songUri, result.imageUri, song);
        setIsDownloaded(true);
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${song.title} is downloaded in the directory`, ToastAndroid.SHORT);
        } else {
          Alert.alert("Download Complete", `${song.title} is downloaded in the directory`);
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadProgress(0);
    } finally {
      setIsDownloading(false);
    }
  }, [song, isDownloading, isDownloaded]);

  useEffect(() => {
    if (isDownloading) {
      downloadSpinnerRotation.value = downloadSpinnerRotation.value % 360;
      downloadSpinnerRotation.value = withRepeat(
        withTiming(downloadSpinnerRotation.value + 360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(downloadSpinnerRotation);
      downloadSpinnerRotation.value = 0;
    }
  }, [isDownloading, downloadSpinnerRotation]);



  const handleDownloadButtonLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setDownloadButtonSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);

  return (
    <Button
      variant="outline"
      className="relative h-12 flex-1 overflow-hidden rounded-full gap-2"
      onPress={handleDownload}
      onLayout={handleDownloadButtonLayout}
    >
      <WaveProgress
        progressValue={downloadProgressValue}
        isPlaying={isDownloading}
        width={downloadButtonSize.width}
        height={downloadButtonSize.height}
        color={primaryColor}
      />
      <View
        pointerEvents="none"
        className="absolute inset-0 flex-row items-center justify-center gap-2"
      >
        {isDownloading ? (
          <>
            <SpinnerIcon rotationDeg={downloadSpinnerRotation} color={color} />
            <Text className="font-semibold">
              {downloadProgress === 1 ? "Saving..." : `${Math.round(downloadProgress * 100)}%`}
            </Text>
          </>
        ) : isDownloaded ? (
          <>
            <DownloadIcon size={20} strokeWidth={1} color={color} />
            <Text className="font-semibold">Downloaded</Text>
          </>
        ) : (
          <>
            <DownloadIcon size={20} strokeWidth={1} color={color} />
            <Text className="font-semibold">Download</Text>
          </>
        )}
      </View>
    </Button>
  );
}
