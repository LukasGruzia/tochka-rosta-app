export function getAvatarExtension(sourceUri: string) {
  const extension = sourceUri.split('.').pop()?.split('?')[0]?.toLowerCase();
  return extension && /^(jpe?g|png|webp|heic)$/.test(extension) ? extension : 'jpg';
}
