import { describe, expect, it } from 'vitest';
import type { DiarySummary } from '@/types/domain';
import { getNextBestAction, getSmartNextStep } from './smartNextStep';

function diary(patch: Partial<DiarySummary> = {}): DiarySummary {
  return { dayId: 1, date: '2026-08-02', targetCalories: 2000, targetProteinG: 120, targetFatG: 70, targetCarbsG: 220, consumedCalories: 500, consumedProteinG: 20, consumedFatG: 10, consumedCarbsG: 50, isCompleted: false, completedAt: null, entries: [{ id: 1, productId: 1, productName: 'Каша', imageKey: '', imageUri: null, sourceType: 'usda', mealType: 'breakfast', servings: 1, servingSizeG: 200, quantityG: 200, calories: 500, proteinG: 20, fatG: 10, carbsG: 50, createdAt: '2026-08-02T08:00:00.000Z' }], ...patch };
}

describe('next best action', () => {
  it('suggests the meal matching the time of day for an empty day', () => {
    expect(getSmartNextStep(null, 9).meal).toBe('breakfast');
    expect(getSmartNextStep(null, 13).meal).toBe('lunch');
    expect(getSmartNextStep(null, 20).meal).toBe('dinner');
  });

  it('prioritizes water in context and the remainder in the evening', () => {
    expect(getNextBestAction({ diary: diary(), hour: 13, waterTotalMl: 0 }).kind).toBe('add-water');
    expect(getNextBestAction({ diary: diary({ consumedCalories: 1200 }), hour: 20, waterTotalMl: 500 }).kind).toBe('close-remainder');
  });

  it('offers day completion and then Flow', () => {
    expect(getNextBestAction({ diary: diary({ consumedCalories: 1920 }), hour: 20 }).kind).toBe('close-day');
    expect(getNextBestAction({ diary: diary({ isCompleted: true }), hour: 20 }).kind).toBe('continue-flow');
  });
});
