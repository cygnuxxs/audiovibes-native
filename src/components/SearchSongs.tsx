import { useSearchSongs } from "@/hooks/useSearchSongs";
import { View } from "react-native";
import DisplaySongs from "./DisplaySongs";
import SongCardSkeleton from "./SongCardSkeleton";
import FloatingPlayer from "./FloatingPlayer";
import { useSearchStore } from "@/store/searchStore";
import { useActiveMediaItem } from "@rntp/player";
import { useAudioStore } from "@/hooks/useAudioStore";

const FLOATING_PLAYER_HEIGHT = 90;

const SearchSongs = () => {
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const { data: songs = [], isFetching } = useSearchSongs(debouncedQuery);

  const activeMedia = useActiveMediaItem();
  const activeTrack = useAudioStore((s) => s.activeTrack);
  const isPlayerVisible = !!(activeMedia || activeTrack);

  return (
    <View className='flex-1'>
      <View className="flex-1">
        {isFetching ? (
          <SongCardSkeleton />
        ) : (
          <DisplaySongs
            songs={songs}
            bottomPadding={isPlayerVisible ? FLOATING_PLAYER_HEIGHT : 0}
          />
        )}
      </View>
      <FloatingPlayer />
    </View>
  );
};

export default SearchSongs;
