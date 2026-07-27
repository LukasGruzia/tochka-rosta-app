import { describe, expect, it } from 'vitest';
import { assertDayCompletable, getNextMealType, scaleDiarySnapshot, sumDiaryNutrition } from './diaryMath';

describe('diary math', () => {
  const entry = { calories: 200, proteinG: 10, fatG: 8, carbsG: null, quantityG: 100 };
  it('sums day nutrition and treats unknown macros as zero only in aggregate', () => { expect(sumDiaryNutrition([entry, { ...entry, calories: 100, proteinG: null }])).toEqual({ calories: 300, proteinG: 10, fatG: 16, carbsG: 0 }); });
  it('scales an edited diary snapshot without changing unknown macros', () => { expect(scaleDiarySnapshot(entry, 150)).toEqual({ calories: 300, proteinG: 15, fatG: 12, carbsG: null }); });
  it('removing an entry changes the aggregate', () => { expect(sumDiaryNutrition([entry, entry]).calories - entry.calories).toBe(200); });
  it('protects a day from repeated completion', () => { expect(() => assertDayCompletable({ date: '2026-07-28', isCompleted: true, entryCount: 1 }, '2026-07-28')).toThrow('уже закрыт'); });
  it('requires entries before completion', () => { expect(() => assertDayCompletable({ date: '2026-07-28', isCompleted: false, entryCount: 0 }, '2026-07-28')).toThrow('хотя бы одно'); });
  it.each([[8, 'breakfast'], [12, 'lunch'], [16, 'snack'], [20, 'dinner']] as const)('selects the next meal at %i:00', (hour, meal) => { expect(getNextMealType(new Date(2026, 6, 28, hour))).toBe(meal); });
});
