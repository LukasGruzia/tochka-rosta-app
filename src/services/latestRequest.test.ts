import { describe, expect, it } from 'vitest';
import { createLatestRequestGuard } from './latestRequest';

describe('latest request guard', () => {
  it('rejects stale search results', () => {
    const guard = createLatestRequestGuard();
    const first = guard.next();
    const second = guard.next();
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
