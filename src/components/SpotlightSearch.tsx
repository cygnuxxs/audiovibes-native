import { memo, useCallback, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Clock, Search, Trash2, X } from "lucide-react-native";

import { Input } from "@/components/ui/input";
import { useSearchStore } from "@/store/searchStore";
import { useActiveColors } from "@/hooks/useActiveColors";
import { Button } from "./ui/button";
import { useDebounce } from "@/hooks/useDebounce";

type Colors = {
  foreground: string;
  mutedForeground: string;
  background: string;
  border: string;
};

// ─────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────

const SearchInputRow = memo(function SearchInputRow({
  colors,
  hasBorder,
  value,
  onChangeText,
  onSubmit,
  onClear,
  onClose,
}: {
  colors: Colors;
  hasBorder: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const hasQuery = value.length > 0;

  return (
    <View
      className="flex-row items-center pl-4 h-16"
      style={{ borderBottomWidth: hasBorder ? 1 : 0, borderBottomColor: colors.border }}
    >
      <Search size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
      <Input
        value={value}
        onChangeText={onChangeText}
        style={{ color: colors.foreground, backgroundColor: colors.background }}
        placeholder="Search songs, albums..."
        className="flex-1 h-full border-0 text-base"
        autoFocus
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      <Button variant="ghost" onPress={hasQuery ? onClear : onClose}>
        <X color={colors.foreground} size={18} />
      </Button>
    </View>
  );
});

const HistoryHeader = memo(function HistoryHeader({
  mutedForeground,
  onClear,
}: {
  mutedForeground: string;
  onClear: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
      <Text
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: mutedForeground }}
      >
        Recent Searches
      </Text>
      <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Trash2 size={14} color={mutedForeground} />
      </TouchableOpacity>
    </View>
  );
});

const SuggestionRow = memo(function SuggestionRow({
  item,
  foreground,
  mutedForeground,
  onSelect,
  onRemove,
}: {
  item: string;
  foreground: string;
  mutedForeground: string;
  onSelect: (item: string) => void;
  onRemove: (item: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3"
    >
      <Clock size={15} color={mutedForeground} style={{ marginRight: 12 }} />
      <Text className="flex-1 text-sm" style={{ color: foreground }} numberOfLines={1}>
        {item}
      </Text>
      <TouchableOpacity
        onPress={() => onRemove(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={13} color={mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

const SpotlightSearch = () => {
  const {
    isSearchVisible,
    setIsSearchVisible,
    searchQuery,
    setSearchQuery,
    setDebouncedQuery,
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  } = useSearchStore();

  const activeColor = useActiveColors();
  const debouncedInput = useDebounce(searchQuery, 200);

  const colors: Colors = useMemo(
    () => ({
      foreground: activeColor["--foreground"],
      mutedForeground: activeColor["--muted-foreground"],
      background: activeColor["--background"],
      border: activeColor["--border"],
    }),
    [activeColor]
  );

  const trimmedInput = debouncedInput.trim();

  const suggestions = useMemo(() => {
    if (!trimmedInput) return searchHistory;
    const query = trimmedInput.toLowerCase();
    return searchHistory.filter((h) => h.toLowerCase().includes(query));
  }, [searchHistory, trimmedInput]);

  const showHeader = trimmedInput.length === 0 && searchHistory.length > 0;
  const showSuggestions = suggestions.length > 0;

  const handleClose = useCallback(() => {
    setIsSearchVisible(false);
  }, [setIsSearchVisible]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
  }, [setSearchQuery]);

  const commitQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      addToHistory(trimmed);
      setDebouncedQuery(trimmed);
      setIsSearchVisible(false);
    },
    [addToHistory, setDebouncedQuery, setIsSearchVisible]
  );

  const handleSubmit = useCallback(() => {
    commitQuery(searchQuery);
  }, [commitQuery, searchQuery]);

  const handleSelectSuggestion = useCallback(
    (item: string) => {
      setSearchQuery(item);
      commitQuery(item);
    },
    [setSearchQuery, commitQuery]
  );

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      backdropColor="rgba(0, 0, 0, 0.5)"
      visible={isSearchVisible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable className="flex-1 justify-center items-center" onPress={handleClose}>
          {/* Stop propagation so tapping inside the card doesn't close it */}
          <Pressable
            className="w-[90%] max-w-xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
            onPress={() => { }}
          >
            <SearchInputRow
              colors={colors}
              hasBorder={showSuggestions}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSubmit}
              onClear={handleClear}
              onClose={handleClose}
            />

            {showSuggestions && (
              <View style={{ maxHeight: 280 }}>
                {showHeader && (
                  <HistoryHeader mutedForeground={colors.mutedForeground} onClear={clearHistory} />
                )}

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {suggestions.map((item, index) => (
                    <SuggestionRow
                      key={`${item}-${index}`}
                      item={item}
                      foreground={colors.foreground}
                      mutedForeground={colors.mutedForeground}
                      onSelect={handleSelectSuggestion}
                      onRemove={removeFromHistory}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SpotlightSearch;