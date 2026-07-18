import { searchSongs } from "@/lib/searchSong";
import { useQuery } from "@tanstack/react-query";

export function useSearchSongs(query: string) {
  return useQuery({
    queryKey: ["songs", query],
    queryFn: () => searchSongs(query, "songs"),
    enabled: query.trim().length > 0,

    // Cache for 5 minutes
    staleTime: 1000 * 60,

    // Keep unused cache for 30 minutes
    gcTime: 1000 * 60 * 10,
  });
}
