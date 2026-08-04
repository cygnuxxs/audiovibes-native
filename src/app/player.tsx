import { useCallback, useEffect } from "react";
import { View, Image, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import TrackPlayer, { useActiveMediaItem, useIsPlaying, useProgress } from "@rntp/player";
import { Disc3, Globe, Zap, Award, Calendar, Headphones, Music2 } from "lucide-react-native";
import { useAudioStore } from "@/hooks/useAudioStore";
import { useSharedValue } from "react-native-reanimated";
import { useActiveColors } from "@/hooks/useActiveColors";

import { PlayerHeader } from "@/components/player/PlayerHeader";
import { PlayerArtwork } from "@/components/player/PlayerArtwork";
import { PlayerTrackInfo } from "@/components/player/PlayerTrackInfo";
import { PlayerSeekBar } from "@/components/player/PlayerSeekBar";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PlayerInfoChips } from "@/components/player/PlayerInfoChips";
import { PlayerArtistsSection } from "@/components/player/PlayerArtistsSection";
import { PlayerReleaseInfo } from "@/components/player/PlayerReleaseInfo";
import { formatPlayCount, formatDuration } from "@/lib/playerUtils";

export default function PlayerScreen() {
  const colors = useActiveColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeMedia = useActiveMediaItem();
  const isPlaying = useIsPlaying();
  const progress = useProgress(0.25);
  // Selectors for store access to avoid re-render loops from reading the whole store object
  const storedActiveTrack = useAudioStore((s) => s.activeTrack);
  const setPosition = useAudioStore((s) => s.setPosition);
  const setDuration = useAudioStore((s) => s.setDuration);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const storePosition = useAudioStore((s) => s.position);
  const storeDuration = useAudioStore((s) => s.duration);
  const storeIsPlaying = useAudioStore((s) => s.isPlaying);

  const displayMedia = activeMedia || storedActiveTrack;
  const track = storedActiveTrack;

  const fallbackDuration =
    Number((track as any)?.duration) ||
    Number((displayMedia as any)?.duration) ||
    0;
  const duration = progress.duration > 0 ? progress.duration : fallbackDuration;

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((position: number) => {
    TrackPlayer.seekTo(position);
  }, []);

  // Mirror live progress into the central audio store so UI components can subscribe.
  useEffect(() => {
    const pos = progress.position ?? 0;
    const dur = progress.duration > 0 ? progress.duration : fallbackDuration;
    const playing = !!isPlaying;

    // Only update the store when values meaningfully change to avoid update loops.
    const POS_THRESHOLD = 0.05; // seconds
    if (Math.abs((storePosition ?? 0) - pos) > POS_THRESHOLD) {
      setPosition(pos);
    }
    if (Math.abs((storeDuration ?? 0) - dur) > 0.1) {
      setDuration(dur);
    }
    if ((storeIsPlaying ?? false) !== playing) {
      setPlaying(playing);
    }
  }, [progress.position, progress.duration, isPlaying, fallbackDuration, storePosition, storeDuration, storeIsPlaying, setPosition, setDuration, setPlaying]);

  // ── Derived metadata ────────────────────────────────────────────────────────
  const artworkUri = (displayMedia as any)?.artworkUrl || (displayMedia as any)?.artwork;
  const title = (displayMedia as any)?.title || "Not Playing";
  const primaryArtist = (displayMedia as any)?.artist || track?.music || "Unknown Artist";

  const album = track?.album;
  const year = track?.year;
  const language = track?.language;
  const label = track?.label;
  const music = track?.music;
  const releaseDate = track?.release_date;
  const playCount = formatPlayCount(track?.play_count);
  const isHQ = track?.kbps_320 === "true" || track?.kbps_320 === "1";
  const isExplicit = track?.explicit_content === "true" || track?.explicit_content === "1";
  const copyright = track?.copyright_text;
  const artists = track?.artists ?? [];

  const chips: { icon: any; label: string; value: string }[] = [];
  if (album) chips.push({ icon: Disc3, label: "Album", value: album });
  if (year) chips.push({ icon: Calendar, label: "Year", value: year });
  if (language) chips.push({ icon: Globe, label: "Language", value: language });
  if (isHQ) chips.push({ icon: Zap, label: "Quality", value: "320 kbps" });
  if (playCount) chips.push({ icon: Headphones, label: "Plays", value: playCount });
  if (duration > 0) chips.push({ icon: Music2, label: "Duration", value: formatDuration(duration) });
  if (label) chips.push({ icon: Award, label: "Label", value: label });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Top section: header + artwork with scrolling blurred background ── */}
        <View style={{ paddingTop: insets.top, overflow: "hidden" }} className="relative">
          {artworkUri && (
            <Image source={{ uri: artworkUri }} blurRadius={30} style={StyleSheet.absoluteFill} />
          )}
          {/* Themed scrim */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors["--background"], opacity: 0.6 },
            ]}
          />

          <PlayerHeader onBack={() => router.back()} />
          <PlayerArtwork artworkUri={artworkUri} isExplicit={isExplicit} />
        </View>

        <PlayerTrackInfo
          title={title}
          artist={primaryArtist}
          composer={music}
        />

        <PlayerSeekBar
          currentPosition={progress.position}
          totalDuration={duration}
          onSeek={handleSeek}
        />

        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />

        <PlayerInfoChips chips={chips} />

        <PlayerArtistsSection artists={artists} />

        <PlayerReleaseInfo releaseDate={releaseDate} copyright={copyright} />
      </ScrollView>
    </View>
  );
}
