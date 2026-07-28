import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { createAvatarFileName, isRemoteAvatarUri } from './avatarFile';

const directory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}profile/` : null;

export interface PreparedAvatar {
  uri: string;
  available: boolean;
  migrated: boolean;
}

export async function persistAvatar(sourceUri: string) {
  if (!directory) throw new Error('Постоянная директория приложения недоступна');
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const optimized = await ImageManipulator.manipulateAsync(sourceUri, [{ resize: { width: 512 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
  const target = `${directory}${createAvatarFileName()}`;
  await FileSystem.copyAsync({ from: optimized.uri, to: target });
  const cacheDirectory = FileSystem.cacheDirectory;
  const cleanup: Promise<void>[] = [];
  if (cacheDirectory && optimized.uri.startsWith(cacheDirectory)) cleanup.push(FileSystem.deleteAsync(optimized.uri, { idempotent: true }));
  if (cacheDirectory && sourceUri.startsWith(cacheDirectory)) cleanup.push(FileSystem.deleteAsync(sourceUri, { idempotent: true }));
  await Promise.allSettled(cleanup);
  return target;
}

export async function prepareStoredAvatar(uri: string): Promise<PreparedAvatar> {
  if (isRemoteAvatarUri(uri)) return { uri, available: true, migrated: false };
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory) return { uri, available: false, migrated: false };
    if (isPersistentAvatar(uri)) return { uri, available: true, migrated: false };
    return { uri: await persistAvatar(uri), available: true, migrated: true };
  } catch (error) {
    if (__DEV__) console.warn('[avatarStorage] Не удалось проверить сохранённый avatar_uri', error);
    return { uri, available: false, migrated: false };
  }
}

export async function deleteStoredAvatar(uri?: string | null) {
  if (directory && uri?.startsWith(directory)) await FileSystem.deleteAsync(uri, { idempotent: true });
}

export function isPersistentAvatar(uri?: string | null) {
  return Boolean(directory && uri?.startsWith(directory));
}

export function getAvatarDirectory() {
  return directory;
}
