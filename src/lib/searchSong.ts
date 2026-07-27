import { decodeQuotes } from "./utils";

export async function searchSongs(query: string, type: string, page?: number): Promise<Song[]> {
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
  return songs;
}
