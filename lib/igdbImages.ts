import { buildIgdbImageUrl } from "@/lib/igdb";

export const igdbImage = (id: string, size?: Parameters<typeof buildIgdbImageUrl>[1]) =>
  buildIgdbImageUrl(id, size ?? "t_cover_big");

// Backwards compatibility
export const igdbImg = igdbImage;

export function igdbCoverUrl(imageId?: string | null) {
  if (!imageId) return null;
  return buildIgdbImageUrl(imageId, "t_cover_big");
}

export function igdbScreenshotUrl(imageId?: string | null) {
  if (!imageId) return null;
  return buildIgdbImageUrl(imageId, "t_1080p");
}

export function igdbArtworkUrl(imageId?: string | null) {
  if (!imageId) return null;
  return buildIgdbImageUrl(imageId, "t_1080p");
}

export function igdbThumbUrl(imageId?: string | null) {
  if (!imageId) return null;
  return buildIgdbImageUrl(imageId, "t_cover_big");
}
