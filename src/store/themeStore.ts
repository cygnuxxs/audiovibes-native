import { ThemeMode, ThemeName } from "@/constants/themes";
import { Appearance } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

interface ThemeState {
  theme: ThemeName;
  mode: ThemeMode;

  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  reset: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "default",
      mode: Appearance.getColorScheme() === "dark" ? "dark" : "light",
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),

      reset: () => set({ theme: "default", mode: "light" }),
    }),
    { name: "theme-storage", storage: zustandStorage },
  ),
);
