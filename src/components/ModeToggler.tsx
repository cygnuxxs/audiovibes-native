import { MoonStar, Sun } from "lucide-react-native";
import { Appearance } from "react-native";

import { Button } from "@/components/ui/button";
import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";

export default function ModeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeStore((state) => state.theme);
  const setMode = useThemeStore((state) => state.setMode);

  const toggleMode = () => {
    const currentMode = useThemeStore.getState().mode;
    const nextMode = currentMode === "dark" ? "light" : "dark";
    
    requestAnimationFrame(() => {
      Appearance.setColorScheme(nextMode);
      setMode(nextMode);
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-l-full border-r-0 text-primary"
      onPress={toggleMode}
    >
      {mode === "dark" ? (
        <MoonStar color={themes[theme][mode]["--primary"]} size={18} />
      ) : (
        <Sun color={themes[theme][mode]["--primary"]} size={18} />
      )}
    </Button>
  );
}
