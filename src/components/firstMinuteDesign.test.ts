import { describe, expect, it } from 'vitest';
import { darkColors, lightColors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

describe('first minute semantic design system', () => {
  it('exposes matching semantic colors in light and dark themes', () => {
    const required = ['surfacePrimary', 'surfaceElevated', 'surfaceSelected', 'surfaceGlass', 'textTertiary', 'accentPrimary', 'accentSoft', 'success', 'borderSubtle', 'separator', 'shadow', 'goldAccent'] as const;
    for (const token of required) {
      expect(darkColors[token]).toBeTruthy();
      expect(lightColors[token]).toBeTruthy();
    }
  });

  it('uses the shared spacing scale and readable typography', () => {
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48]);
    expect(typography.button.fontSize).toBeGreaterThanOrEqual(17);
    expect(typography.caption.fontSize).toBeGreaterThanOrEqual(13);
    expect(typography.metric.fontVariant).toContain('tabular-nums');
  });
});
