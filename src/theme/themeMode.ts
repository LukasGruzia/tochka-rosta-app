import type { ThemeMode } from '@/types/domain';

export function resolveThemeMode(mode: ThemeMode, system: 'dark' | 'light' | null | undefined) {
  return mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
}
