import { describe, expect, it } from 'vitest';
import { getSmartNextStep } from './smartNextStep';

describe('smart next step', () => {
  it('suggests the meal matching the time of day', () => {
    expect(getSmartNextStep(null, 9).meal).toBe('breakfast');
    expect(getSmartNextStep(null, 13).meal).toBe('lunch');
    expect(getSmartNextStep(null, 20).meal).toBe('dinner');
  });
});
