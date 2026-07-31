import { describe, expect, it } from 'vitest';
import { rhythmScenarioCount, rhythmScenarios } from './rhythmScenarios';

describe('Rhythm product scenarios', () => {
  it('defines the 20 primary Beta 1 situations', () => {
    expect(rhythmScenarioCount).toBe(20);
    expect(Object.keys(rhythmScenarios)).toEqual(expect.arrayContaining(['MEAL_ADDED', 'MEAL_REMOVED', 'MEAL_UPDATED', 'DAY_READY_TO_CLOSE', 'DAY_COMPLETED', 'FLOW_MILESTONE', 'RECOMMENDATION_ACCEPTED', 'RECOMMENDATION_REJECTED', 'RECOMMENDATION_REPLACED', 'BUDGET_APPROACHING', 'MEAL_PLAN_CREATED']));
  });

  it('gives every scenario a predictable presentation policy', () => {
    for (const scenario of Object.values(rhythmScenarios)) {
      expect(scenario.priority).toBeGreaterThan(0);
      expect(scenario.screen).toBeTruthy();
      expect(typeof scenario.autoDismiss).toBe('boolean');
      expect(scenario.cooldownMs).toBeGreaterThanOrEqual(0);
    }
  });
});
