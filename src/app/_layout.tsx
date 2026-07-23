import "@/global.css";
import { PortalHost } from "@rn-primitives/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Appearance, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ThemeProvider from "@/components/ThemeProvider";
import { TextClassContext } from "@/components/ui/text";
import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import TrackPlayer, { Event } from '@rntp/player';
import { useSetupTrackPlayer } from '@/hooks/useSetupTrackPlayer';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useSetupTrackPlayer();
  const [queryClient] = useState(() => new QueryClient());
  const fontsLoaded = true;
  const fontLoadError = null;
  const theme = useThemeStore((state) => state.theme);
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    if (fontsLoaded || fontLoadError) {
      SplashScreen.hideAsync();
    }
  }, [fontLoadError, fontsLoaded]);

  useEffect(() => {
    Appearance.setColorScheme(mode);
  }, [mode]);

  useEffect(() => {
    const sub = TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
      console.error("TrackPlayer Error:", error);
    });
    return () => sub.remove();
  }, []);


  if (!fontsLoaded && !fontLoadError) {
    return null;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider name={theme} colorScheme={mode}>
        <SafeAreaProvider>
          <StatusBar
            barStyle={mode === "dark" ? "light-content" : "dark-content"}
            backgroundColor={themes[theme][mode]["--background"]}
          />
          <TextClassContext.Provider value="font-regular">
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: themes[theme][mode]["--background"],
                },
              }}
            />
            <PortalHost />
          </TextClassContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
