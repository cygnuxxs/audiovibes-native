import { useEffect, useState } from 'react';
import TrackPlayer, { PlayerCommand } from '@rntp/player';

const setupPlayer = async () => {
  let isSetup = false;
  try {
    TrackPlayer.setupPlayer({
      android: {
        taskRemovedBehavior: 'stop',
      },
    });
    TrackPlayer.setCommands({
      capabilities: [
        PlayerCommand.PlayPause,
        PlayerCommand.Stop,
      ],
    });
    isSetup = true;
  } catch {
    isSetup = true;
  }
  return isSetup;
};

export function useSetupTrackPlayer() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    let unmounted = false;
    setupPlayer().then((isSetup) => {
      if (!unmounted) {
        setIsPlayerReady(isSetup);
      }
    }).catch((e) => {
      console.warn("Error setting up TrackPlayer:", e);
    });

    return () => {
      unmounted = true;
    };
  }, []);

  return isPlayerReady;
}
