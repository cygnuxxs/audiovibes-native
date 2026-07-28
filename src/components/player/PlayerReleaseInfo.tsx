import { useState } from "react";
import { Pressable, View } from "react-native";
import { Calendar } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useActiveColors } from "@/hooks/useActiveColors";

interface PlayerReleaseInfoProps {
  releaseDate?: string | null;
  copyright?: string;
}

function formatReleaseDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PlayerReleaseInfo({ releaseDate, copyright }: PlayerReleaseInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = useActiveColors();
  const mutedFg = colors["--muted-foreground"];
  const dividerColor = colors["--border"];
  const primaryColor = colors["--primary"];

  if (!releaseDate && !copyright) return null;

  return (
    <View className="px-8 pt-5 pb-2">
      {/* Divider */}
      <View
        className="h-px mb-4"
        style={{ backgroundColor: dividerColor, opacity: 0.5 }}
      />

      {releaseDate && (
        <View className="flex-row items-center gap-1.5 mb-2.5">
          <Calendar size={12} color={primaryColor} strokeWidth={2} />
          <Text
            className="text-xs"
            style={{ color: mutedFg, opacity: 0.8 }}
          >
            Released {formatReleaseDate(releaseDate)}
          </Text>
        </View>
      )}

      {copyright && (
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel="Copyright information"
          accessibilityHint={expanded ? "Tap to collapse" : "Tap to expand"}
          hitSlop={8}
          className="active:opacity-70"
        >
          <View className="flex-row items-start gap-1.5">
            <Text
              className="flex-1 text-[11px] leading-4"
              style={{ color: mutedFg, opacity: 0.55 }}
              numberOfLines={expanded ? undefined : 2}
            >
              {copyright}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
