import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('Beta 1 screen states', () => {
  it('provides geometry-specific static skeletons for core screens', () => {
    const source = read('src/components/ScreenStates.tsx');
    for (const component of ['ProductCardSkeleton', 'DiaryMealSkeleton', 'StatsSkeleton', 'ProfileSkeleton', 'PlannerSkeleton', 'RhythmSuggestionSkeleton']) {
      expect(source).toContain(`function ${component}`);
    }
    expect(source).not.toContain('withRepeat');
    expect(source).not.toContain('setInterval');
  });

  it('keeps retry and secondary recovery actions in one state primitive', () => {
    const source = read('src/components/ScreenStates.tsx');
    expect(source).toContain('actionLabel');
    expect(source).toContain('secondaryActionLabel');
    expect(source).toContain('tone === \'error\'');
  });

  it('uses the shared states in diary, catalog, analytics, planner and Rhythm', () => {
    for (const file of ['src/app/(tabs)/diary.tsx', 'src/app/(tabs)/catalog.tsx', 'src/app/analytics.tsx', 'src/app/meal-plan.tsx', 'src/app/rhythm-center.tsx']) {
      expect(read(file)).toContain("@/components/ScreenStates");
    }
  });
});
