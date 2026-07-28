export function normalizeDisplayName(value?: string | null) {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  return normalized || null;
}
