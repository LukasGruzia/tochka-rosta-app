import { describe, expect, it } from 'vitest';
import { betaChecklist } from './betaChecklist';

describe('Beta 1 checklist', () => {
  it('contains the 20 required tester scenarios without duplicate ids', () => {
    expect(betaChecklist).toHaveLength(20);
    expect(new Set(betaChecklist.map((item) => item.id)).size).toBe(20);
    expect(betaChecklist.map((item) => item.id)).toContain('persistence');
  });
});
