import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import { useShallow } from "zustand/react/shallow";
import { memo } from "react";
import { ScrollView } from "react-native";
import EmptySongsState from "./EmptyState";
import SongCard from "./SongCard";

const DisplaySongs = ({ songs }: { songs: Song[] }) => {
  const { theme, mode } = useThemeStore(useShallow((state) => ({ theme: state.theme, mode: state.mode })));
  const mutedColor = themes[theme][mode]["--muted-foreground"];
  const foregroundColor = themes[theme][mode]["--accent-foreground"];
  const primaryColor = themes[theme][mode]["--primary"];

  return songs.length === 0 ? (
    <EmptySongsState />
  ) : (
    <ScrollView className="flex-1 mb-14">
      {songs.map((item) => (
        <SongCard
          key={item.id}
          songId={item.id}
          playCount={item.play_count}
          duration={item.duration}
          album={item.album}
          year={item.year}
          title={item.title}
          mutedColor={mutedColor}
          foregroundColor={foregroundColor}
          primaryColor={primaryColor}
          downloadUrl={item.downloadUrl}
          imageUrl={item.image}
          artistName={item.primary_artist_name}
          artistImageUrl={item.primary_artist_image}
          song={item}
        />
      ))}
    </ScrollView>
  );
};

export default memo(DisplaySongs);
