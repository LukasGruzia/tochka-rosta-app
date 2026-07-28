import { describe, expect, it } from 'vitest';
import { normalizeDisplayName } from './profileIdentity';

describe('normalizeDisplayName', () => {
  it('uses the saved user name without a hardcoded fallback', () => {
    expect(normalizeDisplayName('  Анна   Смирнова ')).toBe('Анна Смирнова');
  });

  it('returns null for an empty name', () => {
    expect(normalizeDisplayName('   ')).toBeNull();
    expect(normalizeDisplayName(null)).toBeNull();
  });
});
