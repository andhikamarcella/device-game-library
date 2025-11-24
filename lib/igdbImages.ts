export const igdbImg = (id: string, size = "t_1080p") =>
  `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;

export function igdbCoverUrl(imageId?: string | null) {
  if (!imageId) return null;
  return igdbImg(imageId, "t_cover_big");
}

export function igdbScreenshotUrl(imageId?: string | null) {
  if (!imageId) return null;
  return igdbImg(imageId, "t_screenshot_huge");
}

export function igdbArtworkUrl(imageId?: string | null) {
  if (!imageId) return null;
  return igdbImg(imageId, "t_cover_big");
}

export function igdbThumbUrl(imageId?: string | null) {
  if (!imageId) return null;
  return igdbImg(imageId, "t_thumb");
}
