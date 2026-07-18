import { cn, decodeQuotes, formatDuration, formatViews } from "@/lib/utils";
import {
  CirclePlayIcon,
  CircleUserRoundIcon,
  Clock4Icon,
  Disc3Icon,
  HistoryIcon,
  LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Image, View } from "react-native";
import SongAction from "./SongAction";
import { Text } from "./ui/text";

// 1. Reusable Icon Item
const InfoItem = ({
  icon: Icon,
  text,
  color,
  textClassName,
}: {
  icon: LucideIcon;
  text: string | number;
  color: string;
  textClassName?: string;
}) => (
  <View className={"flex-row items-center gap-1"}>
    <Icon color={color} size={18} strokeWidth={1} />
    <Text
      className={cn(
        "text-xs font-medium mr-1 text-muted-foreground",
        textClassName,
      )}
    >
      {text}
    </Text>
  </View>
);

const SongCard = React.memo(({
  songId,
  imageUrl,
  title,
  year,
  album,
  artistName,
  artistImageUrl,
  playCount,
  duration,
  downloadUrl,
  mutedColor,
  foregroundColor,
  primaryColor,
  song,
}: {
  songId: string;
  title: string;
  album: string;
  year: string;
  imageUrl: string;
  duration: number;
  artistName?: string;
  artistImageUrl?: string;
  playCount: string;
  downloadUrl: string;
  mutedColor: string;
  foregroundColor: string;
  primaryColor: string;
  song: Song;
}) => {
  return (
    <View className="border relative bg-background dark:bg-muted border-muted-foreground/20 mb-4 rounded-4xl p-2 gap-2 overflow-hidden">
      {/* Full-width blurred background */}
      <Image
        source={{ uri: imageUrl }}
        blurRadius={10}
        resizeMode="cover"
        className="absolute inset-0 opacity-20"
      />

      <View className="flex-row items-center gap-2">
        <Image source={{ uri: imageUrl.replace("-50x50", "-250x250") }} className="rounded-3xl self-start" width={120} height={120} />

        <View className="flex-1 gap-2 z-10">
          <Text className="font-bold text-lg">{decodeQuotes(title)}</Text>

          <InfoItem
            icon={Disc3Icon}
            text={decodeQuotes(album)}
            textClassName="font-bold"
            color={mutedColor}
          />

          {artistName && (
            <View className="flex-row items-center self-start gap-2">
              {artistImageUrl ? (
                <Image
                  className="size-10 rounded-full"
                  source={{ uri: artistImageUrl }}
                />
              ) : (
                <CircleUserRoundIcon size={24} color={mutedColor} />
              )}
              <Text className="text-xs text-muted-foreground">
                {artistName}
              </Text>
            </View>
          )}

          <View className="flex-row flex-wrap gap-2">
            <InfoItem
              icon={Clock4Icon}
              text={formatDuration(duration)}
              color={mutedColor}
            />
            <InfoItem
              icon={CirclePlayIcon}
              text={formatViews(parseInt(playCount))}
              color={mutedColor}
            />
            <InfoItem icon={HistoryIcon} text={year} color={mutedColor} />
          </View>
        </View>
      </View>

      <SongAction
        song={song}
        songId={songId}
        songUrl={downloadUrl}
        color={foregroundColor}
        primaryColor={primaryColor}
      />
    </View>
  );
});

SongCard.displayName = "SongCard";

export default SongCard;
