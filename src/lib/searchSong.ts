import { decodeQuotes } from "./utils";
import { getCachedData, setCachedData } from "./cache/fileCache";

export async function searchSongs(query: string, type: string, page?: number): Promise<Song[]> {
  const cacheKey = `search_${query}_${type}_${page || 1}`;
  const cachedSongs = await getCachedData(cacheKey);
  if (cachedSongs) {
    // Optionally fetch in background to update cache (stale-while-revalidate style)
    // but React Query already handles background refetching if staleTime is expired.
    return cachedSongs;
  }

  const response = await fetch(
    `https://audiovibes.vercel.app/api/search?query=${encodeURIComponent(query)}&type=${type}${page ? `&page=${page}` : ``}`,
  );
  if (!response.ok) {
    throw new Error("Failed to search songs");
  }
  const songs: Song[] = await response.json();
  songs.forEach((song) => {
    song.title = decodeQuotes(song.title)
  })
  
  // Save to cache asynchronously
  setCachedData(cacheKey, songs);

  return songs;
}
