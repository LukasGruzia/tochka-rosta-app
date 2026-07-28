import { describe, expect, it } from 'vitest';
import { getFlowFlameLevel, shouldAnimateFlowFlame } from './flowFlameState';

describe('FlowFlame states', () => {
  it('maps streak thresholds to stable visual levels', () => {
    expect(getFlowFlameLevel(0)).toBe('seed'); expect(getFlowFlameLevel(1)).toBe('steady'); expect(getFlowFlameLevel(3)).toBe('bright'); expect(getFlowFlameLevel(7)).toBe('strong'); expect(getFlowFlameLevel(14)).toBe('legendary');
  });
  it('disables continuous motion for reduced-motion users', () => { expect(shouldAnimateFlowFlame(true)).toBe(false); expect(shouldAnimateFlowFlame(false)).toBe(true); expect(shouldAnimateFlowFlame(false, false)).toBe(false); });
});
