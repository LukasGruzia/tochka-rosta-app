import { describe, expect, it } from 'vitest';
import { darkColors, lightColors } from './colors';
import { glass } from './glass';

describe('premium theme system', () => {
  it('keeps dark and light palettes independent', () => {
    expect(darkColors.backgroundPrimary).toBe('#041009');
    expect(lightColors.backgroundPrimary).toBe('#F4F7F2');
    expect(lightColors.textPrimary).not.toBe(darkColors.textPrimary);
    expect(lightColors.greenPrimary).not.toBe(darkColors.greenPrimary);
  });

  it('provides every semantic glass level', () => {
    expect(Object.keys(glass)).toEqual(expect.arrayContaining(['base', 'raised', 'interactive', 'accent', 'overlay', 'navigation']));
  });
});
