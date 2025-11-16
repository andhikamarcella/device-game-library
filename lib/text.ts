export function truncateText(text: string, maxLength = 160): string {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength).trimEnd();
  return `${trimmed}…`;
}
