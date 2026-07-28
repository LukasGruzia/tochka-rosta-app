import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('premium interface composition', () => {
  it('uses the dynamic profile name and a standalone round avatar', () => {
    const header = read('src/components/HomeHeader.tsx');
    expect(header).toContain('{userName}');
    expect(header).toContain('useUserProfile()');
    expect(header).toContain('width: sizes.avatar');
    expect(header).toContain('borderRadius: sizes.avatar / 2');
  });

  it('keeps long quick-action labels inside a two-column flexible grid', () => {
    const actions = read('src/components/HomeQuickActions.tsx');
    expect(actions).toContain("width: '48%'");
    expect(actions).toContain('numberOfLines={2}');
    expect(actions).toContain('flex: 1');
  });

  it('uses a responsive nutrition hero with full macro names', () => {
    const hero = read('src/components/NutritionHeroCard.tsx');
    expect(hero).toContain('compact ? 128 : 142');
    expect(hero).toContain('label="Белки"');
    expect(hero).toContain('label="Жиры"');
    expect(hero).toContain('label="Углеводы"');
  });
});
