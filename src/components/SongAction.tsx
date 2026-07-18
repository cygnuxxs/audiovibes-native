import { View } from "react-native";
import PlayButton from "./PlayButton";
import DownloadButton from "./DownloadButton";

const SongAction = ({
  song,
  songUrl,
  songId,
  color,
  primaryColor,
}: {
  song: Song;
  songUrl: string;
  songId: string;
  color: string;
  primaryColor: string;
}) => {
  return (
    <View className="flex-row gap-3">
      <PlayButton song={song} songUrl={songUrl} songId={songId} color={color} primaryColor={primaryColor} />
      <DownloadButton song={song} color={color} primaryColor={primaryColor} />
    </View>
  );
};

export default SongAction;
