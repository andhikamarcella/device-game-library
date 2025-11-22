export function igdbCoverUrl(imageId?: string | null) {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

export function igdbScreenshotUrl(imageId?: string | null) {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_screenshot_med/${imageId}.jpg`;
}
