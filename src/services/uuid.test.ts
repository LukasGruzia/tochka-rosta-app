import { describe, expect, it } from 'vitest';
import { createStableUuid, isStableUuid } from './uuid';

describe('local sync UUID foundation', () => {
  it('creates deterministic valid v4-shaped identifiers when sources are fixed', () => {
    const first = createStableUuid(() => 1_722_160_000_000, () => 0.123456);
    const second = createStableUuid(() => 1_722_160_000_000, () => 0.123456);
    expect(first).toBe(second);
    expect(isStableUuid(first)).toBe(true);
  });

  it('rejects malformed identifiers', () => {
    expect(isStableUuid('local-123')).toBe(false);
    expect(isStableUuid('00000000-0000-5000-a000-000000000000')).toBe(false);
  });
});
