import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createJSONStorage } from "zustand/middleware";

const safeStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const zustandStorage = createJSONStorage(() => safeStorage);

