import { clsx, type ClassValue } from "clsx";
import crypto from "node-forge";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatViews(views: number) {
  if (views < 1e3) return views.toString();
  if (views >= 1e3 && views < 1e5) return (views / 1e3).toFixed(1) + "K";
  if (views >= 1e5 && views < 1e7) return (views / 1e5).toFixed(1) + "L";
  if (views >= 1e7 && views < 1e10) return (views / 1e6).toFixed(1) + "M";
  return (views / 1e7).toFixed(1) + "Cr";
}

export const formatDuration = (
  totalSeconds: number | null | undefined,
): string => {
  if (
    typeof totalSeconds !== "number" ||
    totalSeconds < 0 ||
    !isFinite(totalSeconds)
  ) {
    return "0m 0s";
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
};

export const createDownloadLink = (
  encryptedMediaUrl: string,
): string | null => {
  if (!encryptedMediaUrl) return null;

  const maxQuality = { id: "_320", bitrate: "320kbps" };
  const key = "38346591";
  const iv = "00000000";

  const encrypted = crypto.util.decode64(encryptedMediaUrl);
  const decipher = crypto.cipher.createDecipher(
    "DES-ECB",
    crypto.util.createBuffer(key),
  );
  decipher.start({ iv: crypto.util.createBuffer(iv) });
  decipher.update(crypto.util.createBuffer(encrypted));
  decipher.finish();

  const decryptedLink = decipher.output.getBytes();

  // Replace the default _96 with _320 for max bitrate
  const maxBitrateUrl = decryptedLink.replace("_96", maxQuality.id);

  return maxBitrateUrl;
};

export function generateRandomId(length = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars[(Math.random() * chars.length) | 0];
  }

  return id;
}

export function decodeQuotes(text: string): string {
  return text.replace(/&quot;/g, '"');
}
