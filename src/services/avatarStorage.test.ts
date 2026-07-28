import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareStoredAvatar } from './avatarStorage';

const fs = vi.hoisted(() => ({
  getInfoAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  copyAsync: vi.fn(),
  deleteAsync: vi.fn(),
}));
const manipulateAsync = vi.hoisted(() => vi.fn());

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  cacheDirectory: 'file:///cache/',
  ...fs,
}));
vi.mock('expo-image-manipulator', () => ({
  manipulateAsync,
  SaveFormat: { JPEG: 'jpeg' },
}));

describe('persistent avatar storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fs.makeDirectoryAsync.mockResolvedValue(undefined);
    fs.copyAsync.mockResolvedValue(undefined);
    fs.deleteAsync.mockResolvedValue(undefined);
    manipulateAsync.mockResolvedValue({ uri: 'file:///cache/optimized.jpg' });
  });

  it('migrates an available temporary image into the document directory', async () => {
    fs.getInfoAsync.mockResolvedValue({ exists: true, isDirectory: false });
    const result = await prepareStoredAvatar('file:///cache/picker.jpg');
    expect(result).toMatchObject({ available: true, migrated: true });
    expect(result.uri).toMatch(/^file:\/\/\/documents\/profile\/avatar-.*\.jpg$/);
    expect(fs.copyAsync).toHaveBeenCalledWith({ from: 'file:///cache/optimized.jpg', to: result.uri });
  });

  it('keeps a valid persistent image without rewriting it', async () => {
    fs.getInfoAsync.mockResolvedValue({ exists: true, isDirectory: false });
    const uri = 'file:///documents/profile/avatar-existing.jpg';
    await expect(prepareStoredAvatar(uri)).resolves.toEqual({ uri, available: true, migrated: false });
    expect(manipulateAsync).not.toHaveBeenCalled();
  });

  it('reports a missing image so the UI can show initials', async () => {
    fs.getInfoAsync.mockResolvedValue({ exists: false, isDirectory: false });
    await expect(prepareStoredAvatar('file:///cache/missing.jpg')).resolves.toEqual({ uri: 'file:///cache/missing.jpg', available: false, migrated: false });
    expect(fs.copyAsync).not.toHaveBeenCalled();
  });
});
