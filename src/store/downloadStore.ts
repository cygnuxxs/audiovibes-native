import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

interface DownloadState {
  downloadDirectoryUri: string | null;
  setDownloadDirectoryUri: (uri: string | null) => void;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set) => ({
      downloadDirectoryUri: null,
      setDownloadDirectoryUri: (uri) => set({ downloadDirectoryUri: uri }),
    }),
    { name: "download-storage", storage: zustandStorage },
  ),
);
