import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { onboardingRouteByStep, resolveInitialAppRoute } from './routes';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('first minute routing', () => {
  it('shows Welcome to a new user and bypasses onboarding for an existing user', () => {
    expect(resolveInitialAppRoute(false, 'welcome')).toBe('/(onboarding)/welcome');
    expect(resolveInitialAppRoute(true, 'goal')).toBe('/(tabs)');
  });

  it('resumes every persisted compact step and removes the old marketing route from the main flow', () => {
    expect(Object.keys(onboardingRouteByStep)).toEqual(['welcome', 'goal', 'profile', 'preferences', 'result', 'first-entry']);
    expect(resolveInitialAppRoute(false, 'preferences')).toBe('/(onboarding)/preferences');
    expect(Object.values(onboardingRouteByStep)).not.toContain('/(onboarding)/introduction');
  });
});

describe('first minute UI wiring', () => {
  it('keeps Welcome concise and offers an isolated demo', () => {
    const welcome = read('src/app/(onboarding)/welcome.tsx');
    expect(welcome).toContain('Питание, которое подстраивается под тебя');
    expect(welcome).toContain('Настроить мой Поток');
    expect(welcome).toContain('Посмотреть демо');
    expect(welcome).not.toContain('ScrollView horizontal');
  });

  it('uses explicit back, readable progress and a keyboard-safe compact profile', () => {
    const profile = read('src/app/(onboarding)/personal-data.tsx');
    const shell = read('src/components/OnboardingShell.tsx');
    expect(profile).toContain('showBack');
    expect(profile).toContain('step={{ current: 2, total: 5 }}');
    expect(profile).toContain('accessibilityLiveRegion="polite"');
    expect(shell).toContain('KeyboardAvoidingView');
    expect(shell).toContain('keyboardShouldPersistTaps="handled"');
    expect(shell).toContain('Шаг {step.current} из {step.total}');
  });

  it('does not request device permissions inside onboarding', () => {
    const files = ['welcome', 'goal', 'personal-data', 'preferences', 'calculation', 'first-entry', 'demo'];
    const source = files.map((name) => read(`src/app/(onboarding)/${name}.tsx`)).join('\n');
    expect(source).not.toMatch(/requestCameraPermissions|requestMediaLibraryPermissions|requestPermissionsAsync/);
  });

  it('adds a canonical product only after confirmation and guards repeated taps', () => {
    const source = read('src/app/(onboarding)/first-entry.tsx');
    expect(source).toContain('loadProductsPage');
    expect(source).toContain('AddToDiarySheet');
    expect(source).toContain('addingRef.current');
    expect(source).toContain('await addToDiary');
    expect(source).toContain('Пропустить первую запись');
    expect(source).toContain('completeOnboarding({ wasSkipped: true })');
  });

  it('keeps demo independent of the real app store and SQLite diary writes', () => {
    const source = read('src/app/(onboarding)/demo.tsx');
    expect(source).not.toContain('useAppStore');
    expect(source).not.toContain('addToDiary');
    expect(source).not.toContain('setSetting');
    expect(source).toContain('Реальные данные не были изменены');
  });
});
