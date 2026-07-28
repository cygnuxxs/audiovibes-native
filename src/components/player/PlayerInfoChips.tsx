import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useActiveColors } from "@/hooks/useActiveColors";

interface Chip {
  icon: React.ElementType;
  label: string;
  value: string;
}

interface PlayerInfoChipsProps {
  chips: Chip[];
}

export function PlayerInfoChips({ chips }: PlayerInfoChipsProps) {
  const colors = useActiveColors();
  const cardBg = colors["--card"];
  const labelColor = colors["--muted-foreground"];
  const valueColor = colors["--foreground"];
  const iconColor = colors["--primary"];
  const borderColor = colors["--border"];

  if (!chips || chips.length === 0) return null;

  return (
    <View className="px-5 pt-6 w-full">
      <View className="flex-row flex-wrap justify-between">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <View
              key={chip.label}
              style={{
                width: "48%",
                backgroundColor: cardBg,
                borderColor: borderColor,
                borderWidth: 1,
              }}
              className="mb-3 rounded-2xl p-3.5"
            >
              {/* Header: Icon + Label */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <Icon size={12} color={iconColor} strokeWidth={2} />
                <Text
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: labelColor }}
                  numberOfLines={1}
                >
                  {chip.label}
                </Text>
              </View>

              {/* Value */}
              <Text
                className="text-[15px] font-semibold tracking-tight"
                style={{ color: valueColor }}
                numberOfLines={1}
              >
                {chip.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
