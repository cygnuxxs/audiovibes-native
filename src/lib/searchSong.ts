export async function searchSongs(query: string, type: string, page?: number) {
  const response = await fetch(
    `https://audiovibes.vercel.app/api/search?query=${query}&type=${type}${page ? `&page=${page}` : ``}`,
  );
  if (!response.ok) {
    throw new Error("Failed to search songs");
  }
  return response.json();
}
