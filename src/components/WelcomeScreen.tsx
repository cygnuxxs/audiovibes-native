import React from "react";
import { View, Platform, ActivityIndicator, Pressable } from "react-native";
import { toast } from "sonner-native";
import Animated, {
  FadeInUp,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Headphones, Folder, Music } from "lucide-react-native";
import { StorageAccessFramework } from "expo-file-system/legacy";

import { Text } from "./ui/text";
import { useAppStore } from "@/store/appStore";
import { useDownloadStore } from "@/store/downloadStore";
import { useActiveColors } from "@/hooks/useActiveColors";
import GetStartedButton from "./GetStartedButton";

const FLOAT_1_EASING = Easing.inOut(Easing.ease);
const FLOAT_2_EASING = Easing.inOut(Easing.ease);

export default function WelcomeScreen() {
  const setHasCompletedWelcome = useAppStore((state) => state.setHasCompletedWelcome);
  const setDownloadDirectoryUri = useDownloadStore((state) => state.setDownloadDirectoryUri);
  const activeColors = useActiveColors();
  const [isRequesting, setIsRequesting] = React.useState(false);

  const primaryColor = activeColors["--primary"];
  const primaryForegroundColor = activeColors["--primary-foreground"] ?? "#fff";

  const floatValue1 = useSharedValue(0);
  const floatValue2 = useSharedValue(0);

  React.useEffect(() => {
    floatValue1.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: FLOAT_1_EASING }),
        withTiming(0, { duration: 1500, easing: FLOAT_1_EASING })
      ),
      -1,
      true
    );

    floatValue2.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 1200, easing: FLOAT_2_EASING }),
          withTiming(0, { duration: 1200, easing: FLOAT_2_EASING })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(floatValue1);
      cancelAnimation(floatValue2);
    };
  }, [floatValue1, floatValue2]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue1.value }, { rotate: "-15deg" }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue2.value }, { rotate: "20deg" }],
  }));

  async function handleGetStarted() {
    if (isRequesting) return;

    // iOS doesn't require manual directory setup for basic downloads
    if (Platform.OS !== "android") {
      setHasCompletedWelcome(true);
      return;
    }

    setIsRequesting(true);
    try {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        setDownloadDirectoryUri(permissions.directoryUri);
        setHasCompletedWelcome(true);
      } else {
        toast("Permission Needed", {
          description: "AudioVibes needs a folder to save your tracks for offline listening.",
          action: { label: "Try Again", onClick: () => handleGetStarted() }
        });
      }
    } catch (e) {
      console.warn("Failed to request directory permissions", e);
      toast.error("Something Went Wrong", {
        description: "We couldn't set up your download folder. Please try again."
      });
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <View className="flex-1 bg-background px-6 pt-20 pb-12 justify-between">
      {/* Top Section: Hero & Branding */}
      <View className="items-center justify-center flex-1 mt-8">
        <Animated.View
          entering={FadeInUp.duration(1000).springify()}
          className="relative h-48 w-48 items-center justify-center mb-10"
        >
          {/* Subtle Background Circle */}
          <View className="absolute h-36 w-36 rounded-full bg-primary/10" />

          {/* Main Icon */}
          <Headphones size={64} color={primaryColor} strokeWidth={1.5} />

          {/* Floating Music Notes - Fixed by wrapping standard SVGs in Animated.View */}
          <Animated.View
            style={[animatedStyle1, { position: "absolute", top: 20, left: 24 }]}
            className="opacity-50"
          >
            <Music size={24} color={primaryColor} strokeWidth={1.5} />
          </Animated.View>

          <Animated.View
            style={[animatedStyle2, { position: "absolute", bottom: 30, right: 20 }]}
            className="opacity-40"
          >
            <Music size={20} color={primaryColor} strokeWidth={1.5} />
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(800).springify()}
          className="items-center px-4"
        >
          <Text className="text-4xl font-bold text-center text-foreground tracking-tight mb-3">
            AudioVibes
          </Text>

          <Text className="text-muted-foreground text-center text-base leading-relaxed">
            Your personal music sanctuary. Download and enjoy an immersive listening experience.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Section: Contextual Info & Action */}
      <View className="w-full">
        {/* Only show storage warning on Android to reduce cognitive load on iOS */}
        {Platform.OS === "android" && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(800).springify()}
            className="w-full bg-secondary/40 p-4 rounded-2xl mb-6 flex-row items-center"
          >
            <View className="bg-primary/10 p-3 rounded-xl mr-4">
              <Folder color={primaryColor} size={22} strokeWidth={1.5} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground mb-0.5">
                Setup Storage
              </Text>
              <Text className="text-sm text-muted-foreground">
                Select a folder to securely save your downloaded tracks.
              </Text>
            </View>
          </Animated.View>
        )}
        <Pressable
          // size={'lg'}
          // variant="outline"
          className="rounded-full py-4 border border-border flex-row items-center justify-center gap-2"
          onPress={handleGetStarted}
          disabled={isRequesting}
          accessibilityRole="button"
          accessibilityLabel={Platform.OS === "android" ? "Choose folder and start" : "Get started"}
          accessibilityState={{ disabled: isRequesting, busy: isRequesting }}
        >
          {isRequesting ? (
            <ActivityIndicator color={primaryForegroundColor} />
          ) : (
            <GetStartedButton primaryForegroundColor={primaryForegroundColor} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
