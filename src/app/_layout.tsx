import "@/global.css";
import { Toaster } from "sonner-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalHost } from "@rn-primitives/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Appearance, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ThemeProvider from "@/components/ThemeProvider";
import { TextClassContext } from "@/components/ui/text";
import { useThemeStore } from "@/store/themeStore";
import TrackPlayer, { Event } from '@rntp/player';
import { useSetupTrackPlayer } from '@/hooks/useSetupTrackPlayer';
import { useActiveColors } from '@/hooks/useActiveColors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useSetupTrackPlayer();
  const activeColors = useActiveColors();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider name={theme} colorScheme={mode}>
          <SafeAreaProvider>
            <StatusBar
              barStyle={mode === "dark" ? "light-content" : "dark-content"}
              backgroundColor={activeColors["--background"]}
            />
            <TextClassContext.Provider value="font-regular">
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "ios_from_right",
                  contentStyle: {
                    backgroundColor: activeColors["--background"],
                  },
                }}
              >
                <Stack.Screen
                  name="settings"
                  options={{
                    animation: "slide_from_right",
                    headerShown: false
                  }}
                />
                <Stack.Screen
                  name="player"
                  options={{
                    presentation: "modal",
                    headerShown: false,
                  }}
                />
              </Stack>
              <PortalHost />
              <Toaster
                position="bottom-center"
                theme={mode}
                toastOptions={{
                  style: {
                    backgroundColor: activeColors["--card"],
                    borderColor: activeColors["--border"],
                  },
                  titleStyle: {
                    color: activeColors["--card-foreground"],
                  },
                  descriptionStyle: {
                    color: activeColors["--muted-foreground"],
                  },
                }}
              />
            </TextClassContext.Provider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
