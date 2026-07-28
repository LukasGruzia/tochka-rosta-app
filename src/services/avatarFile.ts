export function getAvatarExtension(sourceUri: string) {
  const extension = sourceUri.split('.').pop()?.split('?')[0]?.toLowerCase();
  return extension && /^(jpe?g|png|webp|heic)$/.test(extension) ? extension : 'jpg';
}

export function createAvatarFileName(now = Date.now(), suffix = Math.random().toString(36).slice(2, 8)) {
  return `avatar-${now.toString(36)}-${suffix}.jpg`;
}

export function isRemoteAvatarUri(uri?: string | null) {
  return Boolean(uri && /^https?:\/\//i.test(uri));
}
