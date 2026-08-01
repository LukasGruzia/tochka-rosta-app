import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('shared nested-screen navigation', () => {
  it('uses history when available and a section fallback for deep links', () => {
    const back = read('src/components/AppBackButton.tsx');
    expect(back).toContain('router.canGoBack()');
    expect(back).toContain('fallbackForPath(pathname)');
    expect(back).toContain("return '/(tabs)/catalog'");
    expect(back).toContain("return '/(tabs)/profile'");
    expect(back).toContain('accessibilityHint="Вернуться на предыдущий экран"');
  });

  it('adds Back only outside the root tab group and suppresses legacy close controls', () => {
    const screen = read('src/components/TabScreen.tsx');
    expect(screen).toContain("segments[0] === '(tabs)'");
    expect(screen).toContain('showBack={shouldShowBack}');
    expect(screen).toContain('right={isRootTab ? headerRight : undefined}');
  });

  it.each([
    ['src/app/product/[id].tsx', 'AppBackButton'],
    ['src/app/food-search.tsx', 'AppBackButton'],
    ['src/app/scanner.tsx', 'AppBackButton'],
    ['src/components/CustomProductForm.tsx', 'AppBackButton'],
    ['src/components/RecipeForm.tsx', 'AppBackButton'],
    ['src/app/edit-profile.tsx', 'showBack'],
  ])('provides a shared Back affordance in %s', (path, marker) => expect(read(path)).toContain(marker));

  it('keeps the touch target at least 44 points', () => {
    const back = read('src/components/AppBackButton.tsx');
    expect(back).toContain('width: 44');
    expect(back).toContain('height: 44');
  });
});
