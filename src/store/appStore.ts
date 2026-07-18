import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

interface AppState {
  hasCompletedWelcome: boolean;
  setHasCompletedWelcome: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedWelcome: false,
      setHasCompletedWelcome: (value) => set({ hasCompletedWelcome: value }),
    }),
    { name: "app-storage", storage: zustandStorage },
  ),
);
