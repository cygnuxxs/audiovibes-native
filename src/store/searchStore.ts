import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

const MAX_HISTORY = 15;

interface SearchState {
  searchQuery: string;
  debouncedQuery: string;
  isSearchVisible: boolean;
  searchHistory: string[];
  setSearchQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
  setIsSearchVisible: (visible: boolean) => void;
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      searchQuery: "telugu songs",
      debouncedQuery: "telugu songs",
      isSearchVisible: false,
      searchHistory: [],
      setSearchQuery: (query) => set({ searchQuery: query }),
      setDebouncedQuery: (query) => set({ debouncedQuery: query }),
      setIsSearchVisible: (visible) => set({ isSearchVisible: visible }),
      addToHistory: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const history = get().searchHistory.filter(
          (h) => h.toLowerCase() !== trimmed.toLowerCase()
        );
        set({ searchHistory: [trimmed, ...history].slice(0, MAX_HISTORY) });
      },
      removeFromHistory: (query) =>
        set((state) => ({
          searchHistory: state.searchHistory.filter((h) => h !== query),
        })),
      clearHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "audiovibes-search-history",
      storage: zustandStorage,
      partialize: (state) => ({ searchHistory: state.searchHistory }),
    }
  )
);
