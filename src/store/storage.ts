import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createJSONStorage } from "zustand/middleware";

const safeStorage = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    SecureStore.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    SecureStore.deleteItemAsync(key);
  },
};

export const zustandStorage = createJSONStorage(() => safeStorage);

