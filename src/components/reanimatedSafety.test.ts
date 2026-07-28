import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Reanimated safety regression', () => {
  it('keeps the shared screen header outside the animated sticky-header path', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/TabScreen.tsx'), 'utf8');
    expect(source).not.toContain('stickyHeaderIndices');
    expect(source).not.toContain('useAnimatedStyle');
    expect(source).not.toContain('useAnimatedScrollHandler');
    expect(source).toContain('<View style={[styles.header');
  });
});
