import type { ThemeName } from "@/constants/themes";
import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import { Palette } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { View } from "react-native";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

const ThemeSelector = () => {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 4,
    right: 4,
  };
  const theme = useThemeStore((state) => state.theme);
  const mode = useThemeStore((state) => state.mode);
  const setTheme = useThemeStore((state) => state.setTheme);
  const themeNames = Object.keys(themes) as ThemeName[];

  const handleThemeChange = (value: string) => {
    setTheme(value as ThemeName);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-r-full">
          <Palette color={themes[theme][mode]["--primary"]} size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent insets={contentInsets} sideOffset={2}>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          {themeNames.map((themeName) => (
            <DropdownMenuRadioItem
              className="items-center gap-2"
              key={themeName}
              value={themeName}
            >
              <View
                className="size-6 rounded-full"
                style={{
                  backgroundColor: themes[themeName][mode]["--primary"],
                }}
              ></View>
              <Text className="capitalize font-bold">{themeName}</Text>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
