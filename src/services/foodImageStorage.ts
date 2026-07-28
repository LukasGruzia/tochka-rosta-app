import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const directory = `${FileSystem.documentDirectory}food-images/`;

export async function persistFoodImage(sourceUri: string) {
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const optimized = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 800 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  const target = `${directory}food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  await FileSystem.copyAsync({ from: optimized.uri, to: target });
  const cacheDirectory = FileSystem.cacheDirectory;
  const cleanup: Promise<void>[] = [];
  if (cacheDirectory && optimized.uri.startsWith(cacheDirectory)) {
    cleanup.push(FileSystem.deleteAsync(optimized.uri, { idempotent: true }));
  }
  if (cacheDirectory && sourceUri.startsWith(cacheDirectory)) {
    cleanup.push(FileSystem.deleteAsync(sourceUri, { idempotent: true }));
  }
  await Promise.allSettled(cleanup);
  return target;
}

export async function deleteStoredFoodImage(uri?: string | null) {
  if (uri?.startsWith(directory)) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export function isPersistentFoodImage(uri?: string | null) {
  return Boolean(uri?.startsWith(directory));
}
