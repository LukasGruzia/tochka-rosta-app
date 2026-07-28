import { describe, expect, it } from 'vitest';
import { resolveThemeMode } from './themeMode';

describe('resolveThemeMode', () => {
  it('follows the system preference in system mode', () => {
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
  });

  it('keeps an explicit mode and defaults system to dark when unknown', () => {
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
    expect(resolveThemeMode('system', null)).toBe('dark');
  });
});
