/** Clamp a ratio to [0, 1] — runs on the UI thread. */
export function clampRatio(v: number) {
  "worklet";
  return Math.max(0, Math.min(1, v));
}

/** Format seconds as M:SS — runs on the UI thread. */
export function formatDisplayTime(seconds: number) {
  "worklet";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Format seconds as "Xm Ys" — JS thread only. */
export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

/** Compact-format a play-count string, e.g. "1200000" → "1.2M". */
export function formatPlayCount(count: string | undefined) {
  if (!count) return null;
  const n = parseInt(count, 10);
  if (isNaN(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
