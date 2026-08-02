export type AppVariant = 'development' | 'preview' | 'production';

export interface BuildInfo {
  version: string;
  buildNumber: string;
  buildProfile: string;
  appVariant: AppVariant;
  expoSdk: string;
  databaseVersion: number | string;
  seedVersion: string;
  onboardingVersion: number;
  runtimeVersion: string;
  updateChannel: string;
  updateId: string | null;
  buildDate: string | null;
  executionEnvironment: string;
}

export function normalizeAppVariant(value: unknown): AppVariant {
  return value === 'development' || value === 'preview' ? value : 'production';
}

export function createBuildInfo(input: Partial<BuildInfo> = {}): BuildInfo {
  return {
    version: input.version ?? '0.0.0',
    buildNumber: input.buildNumber ?? '—',
    buildProfile: input.buildProfile ?? 'local',
    appVariant: normalizeAppVariant(input.appVariant),
    expoSdk: input.expoSdk ?? 'unknown',
    databaseVersion: input.databaseVersion ?? '—',
    seedVersion: input.seedVersion ?? 'unknown',
    onboardingVersion: input.onboardingVersion ?? 0,
    runtimeVersion: input.runtimeVersion ?? 'не встроена',
    updateChannel: input.updateChannel ?? 'не настроен',
    updateId: input.updateId ?? null,
    buildDate: input.buildDate ?? null,
    executionEnvironment: input.executionEnvironment ?? 'unknown',
  };
}
