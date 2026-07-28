import { describe, expect, it } from 'vitest';
import { TAB_ROUTES, getProductRoute, getTabRoute, validateTabRoutes } from './routes';

describe('static tab routes', () => {
  it('contains five unique, valid routes', () => {
    expect(TAB_ROUTES).toHaveLength(5);
    expect(new Set(TAB_ROUTES.map((item) => item.key)).size).toBe(5);
    expect(validateTabRoutes().every((item) => item.valid)).toBe(true);
  });

  it('does not derive a route from a Russian label', () => {
    expect(getTabRoute('Главная')).toBeUndefined();
    expect(getTabRoute('index')?.route).toBe('/(tabs)');
  });

  it('requires a valid product id for deep links', () => {
    expect(getProductRoute(12)).toBe('/product/12');
    expect(getProductRoute(undefined)).toBeNull();
    expect(getProductRoute('not-a-number')).toBeNull();
  });
});
