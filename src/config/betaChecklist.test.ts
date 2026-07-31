import { describe, expect, it } from 'vitest';
import { betaChecklist } from './betaChecklist';

describe('Beta 1 checklist', () => {
  it('contains the 15 required tester scenarios without duplicate ids', () => {
    expect(betaChecklist).toHaveLength(15);
    expect(new Set(betaChecklist.map((item) => item.id)).size).toBe(15);
    expect(betaChecklist.map((item) => item.label)).toContain('Восстановить backup');
  });
});
