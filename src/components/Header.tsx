import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { MoreVertical, Search } from "lucide-react-native";
import { Link } from "expo-router";
import { useSearchStore } from '@/store/searchStore';
import { useActiveColors } from "@/hooks/useActiveColors";
import { Button } from "./ui/button";

const Header = () => {
  const setIsSearchVisible = useSearchStore((state) => state.setIsSearchVisible);
  const activeColors = useActiveColors();
  return (
    <View className="px-1 w-full py-2 bg-background items-center flex-row justify-between">
      <View className="flex-row items-end">
        <Text className="font-bold rounded-full text-2xl text-primary dark:text-foreground px-2">
          AudioVibes
        </Text>
        <Text className="font-bold text-primary dark:text-foreground text-[0.5rem]">
          by Cygnuxxs
        </Text>
      </View>
      <View className="flex-row p-1 items-center gap-2 mr-2">
        <Button onPress={() => setIsSearchVisible(true)} variant="ghost" className="p-1">
          <Search color={activeColors["--foreground"]} size={22} />
        </Button>
        <Link href="/settings" asChild>
          <Pressable>
            <MoreVertical color={activeColors["--foreground"]} size={24} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
};

export default Header;
