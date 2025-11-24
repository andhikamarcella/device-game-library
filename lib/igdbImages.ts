import { bestImageOriginal, buildIgdbImageUrl } from "@/lib/igdb";

export const igdbImage = (
  id: string,
  size: Parameters<typeof buildIgdbImageUrl>[1] = "original",
) => buildIgdbImageUrl(id, size);

// Backwards compatibility
export const igdbImg = igdbImage;

export function igdbCoverUrl(imageId?: string | null) {
  if (!imageId) return null;
  return bestImageOriginal(imageId);
}

export function igdbScreenshotUrl(imageId?: string | null) {
  if (!imageId) return null;
  return bestImageOriginal(imageId);
}

export function igdbArtworkUrl(imageId?: string | null) {
  if (!imageId) return null;
  return bestImageOriginal(imageId);
}

export function igdbThumbUrl(imageId?: string | null) {
  if (!imageId) return null;
  return bestImageOriginal(imageId);
}
