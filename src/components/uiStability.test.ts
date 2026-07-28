import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('critical UI stability wiring', () => {
  it('keeps refs out of the press animation worklet', () => {
    const source = read('src/components/AppPressable.tsx');
    const animatedStyle = source.slice(source.indexOf('useAnimatedStyle'), source.indexOf('const handlePressIn'));
    expect(animatedStyle).not.toContain('.current');
    expect(animatedStyle).toContain('scale.get()');
  });

  it('keeps tab drag behind a safe-mode-compatible feature flag', () => {
    const flags = read('src/config/features.ts'); const tabBar = read('src/components/LiquidTabBar.tsx');
    expect(flags).toContain('enableLiquidTabDrag: true');
    expect(tabBar).toContain('flags.enableLiquidTabDrag');
    expect(tabBar).toContain('performTabPress');
  });

  it('keeps safe-area outside the visual tab surface and centers items', () => {
    const tabBar = read('src/components/LiquidTabBar.tsx');
    expect(tabBar).toContain('height: metrics.visualHeight');
    expect(tabBar).toContain('bottom: metrics.bottomOffset');
    expect(tabBar).not.toContain('metrics.safeAreaHeight');
    expect(tabBar).toContain("alignItems: 'center'");
    expect(tabBar).toContain("justifyContent: 'center'");
  });

  it('provides all three ErrorBoundary recovery actions', () => {
    const layout = read('src/app/_layout.tsx');
    expect(layout).toContain('Попробовать снова');
    expect(layout).toContain('Вернуться на главную');
    expect(layout).toContain('Скопировать технические данные');
  });
});
