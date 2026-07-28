import { describe, expect, it } from 'vitest';
import { getProfileAvatarSize } from './avatarLayout';

describe('adaptive profile avatar', () => {
  it('stays compact on a small iPhone', () => {
    expect(getProfileAvatarSize(320)).toBeGreaterThanOrEqual(88);
    expect(getProfileAvatarSize(320)).toBeLessThanOrEqual(96);
  });

  it('uses the standard range on regular screens', () => {
    expect(getProfileAvatarSize(390)).toBeGreaterThanOrEqual(96);
    expect(getProfileAvatarSize(390)).toBeLessThanOrEqual(108);
  });

  it('grows without becoming oversized on wide screens', () => {
    expect(getProfileAvatarSize(440)).toBeGreaterThanOrEqual(108);
    expect(getProfileAvatarSize(440)).toBeLessThanOrEqual(116);
  });
});
