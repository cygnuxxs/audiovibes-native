import { create } from "zustand";

export interface DownloadMetric {
  id: string;
  songTitle: string;
  downloadDurationMs: number;
  metadataDurationMs: number | null;
  fileSizeBytes: number | null;
  timestamp: number;
}

interface MetricsState {
  // Session-level counters
  totalDownloads: number;
  totalMetadataWrites: number;
  totalBytesDownloaded: number;

  // Timing lists (last 50 entries each)
  downloadMetrics: DownloadMetric[];

  // Session start time
  sessionStartMs: number;

  // Actions
  recordDownloadStart: (id: string, songTitle: string) => void;
  recordDownloadComplete: (
    id: string,
    durationMs: number,
    fileSizeBytes: number | null
  ) => void;
  recordMetadataWrite: (id: string, durationMs: number) => void;
  reset: () => void;
}

// In-flight map: tracks when each download started
const _inFlight: Record<string, number> = {};

export const useMetricsStore = create<MetricsState>((set, get) => ({
  totalDownloads: 0,
  totalMetadataWrites: 0,
  totalBytesDownloaded: 0,
  downloadMetrics: [],
  sessionStartMs: Date.now(),

  recordDownloadStart: (id, songTitle) => {
    _inFlight[id] = Date.now();
    // Eagerly add a pending entry so the list order is preserved
    const pending: DownloadMetric = {
      id,
      songTitle,
      downloadDurationMs: 0,
      metadataDurationMs: null,
      fileSizeBytes: null,
      timestamp: Date.now(),
    };
    set((s) => ({
      downloadMetrics: [pending, ...s.downloadMetrics].slice(0, 50),
    }));
  },

  recordDownloadComplete: (id, durationMs, fileSizeBytes) => {
    delete _inFlight[id];
    set((s) => ({
      totalDownloads: s.totalDownloads + 1,
      totalBytesDownloaded:
        s.totalBytesDownloaded + (fileSizeBytes ?? 0),
      downloadMetrics: s.downloadMetrics.map((m) =>
        m.id === id ? { ...m, downloadDurationMs: durationMs, fileSizeBytes } : m
      ),
    }));
  },

  recordMetadataWrite: (id, durationMs) => {
    set((s) => ({
      totalMetadataWrites: s.totalMetadataWrites + 1,
      downloadMetrics: s.downloadMetrics.map((m) =>
        m.id === id ? { ...m, metadataDurationMs: durationMs } : m
      ),
    }));
  },

  reset: () =>
    set({
      totalDownloads: 0,
      totalMetadataWrites: 0,
      totalBytesDownloaded: 0,
      downloadMetrics: [],
      sessionStartMs: Date.now(),
    }),
}));

// ─── Selectors ───────────────────────────────────────────────────────────────

export function selectAvgDownloadMs(metrics: DownloadMetric[]): number | null {
  const completed = metrics.filter((m) => m.downloadDurationMs > 0);
  if (!completed.length) return null;
  return completed.reduce((s, m) => s + m.downloadDurationMs, 0) / completed.length;
}

export function selectAvgMetadataMs(metrics: DownloadMetric[]): number | null {
  const written = metrics.filter((m) => m.metadataDurationMs !== null);
  if (!written.length) return null;
  return (
    written.reduce((s, m) => s + (m.metadataDurationMs ?? 0), 0) / written.length
  );
}

export function selectFastestMetadataMs(metrics: DownloadMetric[]): number | null {
  const written = metrics
    .map((m) => m.metadataDurationMs)
    .filter((v): v is number => v !== null);
  return written.length ? Math.min(...written) : null;
}
