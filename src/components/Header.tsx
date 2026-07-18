import { Text, View } from "react-native";
import ModeToggler from "./ModeToggler";
import ThemeSelector from "./ThemeSelector";

const Header = () => {
  return (
    <View className="px-1 w-full bg-background items-center flex-row justify-between">
      <View className="flex-row items-end">
        <Text className="font-bold rounded-full text-2xl text-primary dark:text-foreground px-2">
          AudioVibes
        </Text>
        <Text className="font-bold text-primary dark:text-foreground text-[0.5rem]">
          by Cygnuxxs
        </Text>
      </View>
      <View className="flex-row p-1 items-center">
        <ModeToggler />
        <ThemeSelector />
      </View>
    </View>
  );
};

export default Header;
