import { describe, expect, it } from 'vitest';
import { formatProductUpdatedAt, getProductMatchLabel, getProductSourceLabel } from './productPresentation';

describe('product presentation', () => {
  it('never exposes technical source enums to the user', () => {
    expect(getProductSourceLabel({ sourceType: 'tochka_rosta', dataStatus: 'verified' })).toBe('Проверено «Точкой Роста»');
    expect(getProductSourceLabel({ sourceType: 'usda', dataStatus: 'imported' })).toBe('Официальная база USDA');
    expect(getProductSourceLabel({ sourceType: 'open_food_facts', dataStatus: 'community' })).toBe('Данные сообщества');
    expect(getProductSourceLabel({ sourceType: 'user_recipe', dataStatus: 'custom' })).toBe('Добавлено пользователем');
  });

  it('uses trust-oriented match labels instead of a numeric score', () => {
    expect([0, 1, 4].map(getProductMatchLabel)).toEqual(['Отличное совпадение', 'Хорошо подходит', 'Можно рассмотреть']);
  });

  it('formats valid dates and handles missing metadata', () => {
    expect(formatProductUpdatedAt(null)).toBe('Дата обновления не указана');
    expect(formatProductUpdatedAt('2026-07-31T10:00:00.000Z')).toContain('2026');
  });
});
