import { useSearchSongs } from "@/hooks/useSearchSongs";
import { X } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DisplaySongs from "./DisplaySongs";
import SongCardSkeleton from "./SongCardSkeleton";
import { Input } from "./ui/input";
import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";
import { useShallow } from 'zustand/react/shallow';

const DEBOUNCE_MS = 1200;
const DEFAULT_QUERY = "telugu songs";

const SearchSongs = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState(DEFAULT_QUERY);
  const [debouncedQuery, setDebouncedQuery] = useState(DEFAULT_QUERY);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: songs = [], isFetching } = useSearchSongs(debouncedQuery);
  const { theme, mode } = useThemeStore(useShallow((state) => ({ theme: state.theme, mode: state.mode })));

  const normalizeQuery = (query: string) => {
    const trimmed = query.trim();
    return trimmed.length === 0 ? DEFAULT_QUERY : trimmed;
  };
  const handleSearch = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDebouncedQuery(normalizeQuery(query));
  }, []);

  const handleChangeText = useCallback((text: string) => {
    setSearchQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(normalizeQuery(text));
    }, DEBOUNCE_MS);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 55 : 0}
    >
      <View style={{ flex: 1 }}>
        {isFetching ? <SongCardSkeleton /> : <DisplaySongs songs={songs} />}
      </View>
      <View className="flex-row bg-background/80 absolute bottom-0 left-0 right-0 items-center gap-2 p-2 border-t border-border/20">
        <View className="flex-1 relative justify-center">
          <Input
            className="w-full rounded-full h-12 pl-4 pr-10"
            placeholder="Search your songs..."
            value={searchQuery}
            onChangeText={handleChangeText}
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <Pressable
              className="absolute right-2 p-2"
              onPress={() => handleChangeText("")}
            >
              <X color={themes[theme][mode]['--muted-foreground']} size={16} />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SearchSongs;
