import { MoonStar, Sun } from "lucide-react-native";
import { Appearance } from "react-native";

import { Button } from "@/components/ui/button";
import { useActiveColors } from "@/hooks/useActiveColors";
import { useThemeStore } from "@/store/themeStore";

export default function ModeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const activeColor = useActiveColors();

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
      variant="secondary"
      className="text-primary size-16 rounded-2xl"
      onPress={toggleMode}
    >
      {mode === "dark" ? (
        <MoonStar color={activeColor['--primary']} size={24} />
      ) : (
        <Sun color={activeColor["--primary"]} size={24} />
      )}
    </Button>
  );
}
