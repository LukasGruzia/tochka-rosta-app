import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const directory = `${FileSystem.documentDirectory}profile/`;

export async function persistAvatar(sourceUri: string) {
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const optimized = await ImageManipulator.manipulateAsync(sourceUri, [{ resize: { width: 512 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
  const target = `${directory}avatar-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: optimized.uri, to: target });
  const cacheDirectory = FileSystem.cacheDirectory;
  const cleanup: Promise<void>[] = [];
  if (cacheDirectory && optimized.uri.startsWith(cacheDirectory)) cleanup.push(FileSystem.deleteAsync(optimized.uri, { idempotent: true }));
  if (cacheDirectory && sourceUri.startsWith(cacheDirectory)) cleanup.push(FileSystem.deleteAsync(sourceUri, { idempotent: true }));
  await Promise.allSettled(cleanup);
  return target;
}

export async function deleteStoredAvatar(uri?: string | null) { if (uri?.startsWith(directory)) await FileSystem.deleteAsync(uri, { idempotent: true }); }
export function isPersistentAvatar(uri?: string | null) { return Boolean(uri?.startsWith(directory)); }
