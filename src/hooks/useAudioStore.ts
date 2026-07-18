import { create } from "zustand";
import TrackPlayer, { PlaybackState } from "@rntp/player";

interface Track {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  artwork?: string;
}

interface AudioState {
  play: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  toggle: (track: Track) => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => {
  return {
    play: async (track) => {
      const currentTrack = TrackPlayer.getActiveMediaItem();

      if (currentTrack?.mediaId !== track.id) {
        TrackPlayer.setMediaItem({
          mediaId: track.id,
          url: track.url,
          title: track.title || "Unknown Title",
          artist: track.artist || "Unknown Artist",
          artworkUrl: track.artwork,
        });
      }

      TrackPlayer.play();
    },

    pause: async () => {
      TrackPlayer.pause();
    },

    toggle: async (track) => {
      const currentTrack = TrackPlayer.getActiveMediaItem();

      if (currentTrack?.mediaId !== track.id) {
        TrackPlayer.setMediaItem({
          mediaId: track.id,
          url: track.url,
          title: track.title || "Unknown Title",
          artist: track.artist || "Unknown Artist",
          artworkUrl: track.artwork,
        });
      }

      const isPlaying = TrackPlayer.isPlaying();
      if (isPlaying) {
        get().pause();
      } else {
        let state;
        try {
          const playbackState = await TrackPlayer.getPlaybackState() as any;
          state = playbackState?.state ?? playbackState;
        } catch (e) {
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
  };
});
