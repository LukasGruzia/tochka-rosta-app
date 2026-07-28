import { describe, expect, it } from 'vitest';
import { getFlowFlameLevel } from './flowFlameState';

describe('FlowFlame states', () => {
  it('maps streak thresholds to stable visual levels', () => {
    expect(getFlowFlameLevel(0)).toBe('seed'); expect(getFlowFlameLevel(1)).toBe('steady'); expect(getFlowFlameLevel(3)).toBe('bright'); expect(getFlowFlameLevel(7)).toBe('strong'); expect(getFlowFlameLevel(14)).toBe('legendary');
  });
});
