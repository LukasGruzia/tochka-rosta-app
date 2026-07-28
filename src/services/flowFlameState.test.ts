import { describe, expect, it } from 'vitest';
import { getFlowFlameDimensions, getFlowFlameLevel, shouldAnimateFlowFlame } from './flowFlameState';

describe('FlowFlame states', () => {
  it('maps streak thresholds to stable visual levels', () => {
    expect(getFlowFlameLevel(0)).toBe('seed');
    expect(getFlowFlameLevel(1)).toBe('ember');
    expect(getFlowFlameLevel(2)).toBe('ember');
    expect(getFlowFlameLevel(3)).toBe('growing');
    expect(getFlowFlameLevel(7)).toBe('deep');
    expect(getFlowFlameLevel(14)).toBe('gilded');
    expect(getFlowFlameLevel(30)).toBe('premium');
    expect(getFlowFlameLevel(60)).toBe('legendary');
  });
  it('disables continuous motion for reduced-motion users', () => { expect(shouldAnimateFlowFlame(true)).toBe(false); expect(shouldAnimateFlowFlame(false)).toBe(true); expect(shouldAnimateFlowFlame(false, false)).toBe(false); });
  it('keeps the premium flame tall and narrow', () => { expect(getFlowFlameDimensions(200)).toEqual({ width: 136, height: 200 }); });
});
