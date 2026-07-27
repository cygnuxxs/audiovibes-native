import Header from "@/components/Header";
import SearchSongs from "@/components/SearchSongs";
import WelcomeScreen from "@/components/WelcomeScreen";
import { useAppStore } from "@/store/appStore";
import { SafeAreaView } from "react-native-safe-area-context";

import SpotlightSearch from "@/components/SpotlightSearch";

const HomeScreen = () => {
  const hasCompletedWelcome = useAppStore((state) => state.hasCompletedWelcome);

  if (!hasCompletedWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
      <Header />
      <SearchSongs />
      <SpotlightSearch />
    </SafeAreaView>
  );
};

export default HomeScreen;
