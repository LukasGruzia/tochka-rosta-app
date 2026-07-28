export function normalizeDisplayName(value?: string | null) {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  return normalized || null;
}

export function getProfileInitials(value?: string | null) {
  const name = normalizeDisplayName(value);
  return name ? name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'ТР';
}
