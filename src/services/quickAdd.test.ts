import { describe, expect, it } from 'vitest';
import { getQuickAddRoute, prioritizeQuickActions, quickAddOptions } from './quickAdd';

describe('global quick add', () => {
  it('brings the last action to the front without losing actions', () => {
    const result = prioritizeQuickActions('water');
    expect(result[0].key).toBe('water');
    expect(result).toHaveLength(quickAddOptions.length);
    expect(new Set(result.map((item) => item.key)).size).toBe(quickAddOptions.length);
  });

  it('routes navigation actions and keeps database actions local', () => {
    expect(getQuickAddRoute('favorites')).toBe('/food-search');
    expect(getQuickAddRoute('scan')).toBe('/scanner');
    expect(getQuickAddRoute('weight')).toBe('/weight-progress');
    expect(getQuickAddRoute('repeat')).toBeNull();
    expect(getQuickAddRoute('yesterday')).toBeNull();
  });
});
