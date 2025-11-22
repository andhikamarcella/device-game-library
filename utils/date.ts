export function daysUntil(timestampSeconds: number | null | undefined): number | null {
  if (!timestampSeconds) return null;
  const now = Date.now();
  const target = Number(timestampSeconds) * 1000;
  if (!Number.isFinite(target)) return null;
  const diffMs = target - now;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function daysSince(timestampSeconds: number | null | undefined): number | null {
  if (!timestampSeconds) return null;
  const now = Date.now();
  const target = Number(timestampSeconds) * 1000;
  if (!Number.isFinite(target)) return null;
  const diffMs = now - target;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatCountdown(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return "Released";
  if (days === 0) return "Releases today";
  if (days === 1) return "Releases in 1 day";
  return `Releases in ${days} days`;
}

export function formatDaysAgo(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return null;
  if (days === 0) return "Released today";
  if (days === 1) return "Released 1 day ago";
  return `Released ${days} days ago`;
}

export function formatDateFromSeconds(timestampSeconds: number | null | undefined): string | null {
  if (!timestampSeconds) return null;
  const date = new Date(Number(timestampSeconds) * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
