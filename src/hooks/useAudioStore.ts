import { create } from "zustand";
import TrackPlayer, { PlaybackState } from "@rntp/player";

interface Track {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  artwork?: string;
  // Extended Song metadata
  album?: string;
  label?: string;
  music?: string;
  language?: string;
  year?: string;
  release_date?: string | null;
  play_count?: string;
  kbps_320?: string;
  copyright_text?: string;
  explicit_content?: string;
  artists?: Artist[];
}

interface AudioState {
  activeTrack: Track | null;
  play: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  toggle: (track: Track) => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  // Progress fields
  position: number; // seconds
  duration: number; // seconds
  isPlaying: boolean;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setPlaying: (playing: boolean) => void;
}

export const useAudioStore = create<AudioState>((set, get) => {
  return {
    activeTrack: null,
    position: 0,
    duration: 0,
    isPlaying: false,
    play: async (track) => {
      const currentTrack = TrackPlayer.getActiveMediaItem();

      if (currentTrack?.mediaId !== track.id) {
        TrackPlayer.setMediaItem({
          mediaId: track.id,
          url: track.url,
          title: track.title || "Unknown Title",
          artist: track.artist || "Unknown Artist",
          artworkUrl: track.artwork,
          duration: (track as any).duration ? Number((track as any).duration) : undefined,
        });
      }

      set({ activeTrack: track });
      TrackPlayer.play();
    },

    pause: async () => {
      TrackPlayer.pause();
    },

    toggle: async (track) => {
      const currentTrack = TrackPlayer.getActiveMediaItem();
      const isDifferentTrack = currentTrack?.mediaId !== track.id;

      if (isDifferentTrack) {
        TrackPlayer.setMediaItem({
          mediaId: track.id,
          url: track.url,
          title: track.title || "Unknown Title",
          artist: track.artist || "Unknown Artist",
          artworkUrl: track.artwork,
          duration: (track as any).duration ? Number((track as any).duration) : undefined,
        });

        set({ activeTrack: track });
        TrackPlayer.play();
        return;
      }

      const isPlaying = TrackPlayer.isPlaying();
      if (isPlaying) {
        get().pause();
      } else {
        let state;
        try {
          const playbackState = TrackPlayer.getPlaybackState() as any;
          state = playbackState?.state ?? playbackState;
        } catch {
          // fallback if method fails
        }
        if (state === PlaybackState.Ended) {
          TrackPlayer.seekTo(0);
        }
        TrackPlayer.play();
      }
    },

    seekTo: async (seconds) => {
      TrackPlayer.seekTo(seconds);
    },

    // Progress setters
    setPosition: (pos: number) => set({ position: pos }),
    setDuration: (dur: number) => set({ duration: dur }),
    setPlaying: (playing: boolean) => set({ isPlaying: playing }),
  };
});
