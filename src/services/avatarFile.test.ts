import { describe, expect, it } from 'vitest';
import { createAvatarFileName, getAvatarExtension, isRemoteAvatarUri } from './avatarFile';

describe('avatar file persistence', () => {
  it('keeps supported local image extensions', () => {
    expect(getAvatarExtension('file:///photo.HEIC')).toBe('heic');
    expect(getAvatarExtension('file:///photo.png?edited=1')).toBe('png');
  });

  it('falls back to jpeg for temporary or unknown URIs', () => {
    expect(getAvatarExtension('ph://temporary-asset')).toBe('jpg');
  });

  it('creates a stable unique cache-busting file name per saved avatar', () => {
    expect(createAvatarFileName(1_000, 'abc123')).toBe('avatar-rs-abc123.jpg');
  });

  it('distinguishes remote avatar sources from local files', () => {
    expect(isRemoteAvatarUri('https://example.com/avatar.jpg')).toBe(true);
    expect(isRemoteAvatarUri('file:///profile/avatar.jpg')).toBe(false);
  });
});
