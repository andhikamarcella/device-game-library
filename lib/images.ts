export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }

  return trimmed;
}

export function pickBestImage(candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}
