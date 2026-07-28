import { describe, expect, it } from 'vitest';
import { getAvatarExtension } from './avatarFile';

describe('avatar file persistence', () => {
  it('keeps supported local image extensions', () => {
    expect(getAvatarExtension('file:///photo.HEIC')).toBe('heic');
    expect(getAvatarExtension('file:///photo.png?edited=1')).toBe('png');
  });

  it('falls back to jpeg for temporary or unknown URIs', () => {
    expect(getAvatarExtension('ph://temporary-asset')).toBe('jpg');
  });
});
