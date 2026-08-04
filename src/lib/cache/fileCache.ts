import { Directory, File, Paths } from 'expo-file-system';

const cacheDir = new Directory(Paths.cache, 'audiovibes_search_cache');

export const ensureCacheDir = async () => {
  if (!cacheDir.exists) {
    cacheDir.create();
  }
};

export const getCachedData = async (key: string) => {
  try {
    const file = new File(cacheDir, encodeURIComponent(key) + '.json');
    if (file.exists) {
      const content = await file.text();
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
};

export const setCachedData = async (key: string, data: any) => {
  try {
    await ensureCacheDir();
    const file = new File(cacheDir, encodeURIComponent(key) + '.json');
    if (!file.exists) {
      file.create();
    }
    file.write(JSON.stringify(data));
  } catch (e) {
    console.error('Cache write error:', e);
  }
};
