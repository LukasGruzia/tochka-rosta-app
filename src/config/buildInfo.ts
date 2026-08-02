import { Platform } from 'react-native';
import Constants from 'expo-constants';
import packageJson from '../../package.json';
import { migrations } from '@/database/schema';
import { seedDataVersion } from '@/database/database';
import { ONBOARDING_VERSION } from '@/features/onboarding/onboardingState';

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
    expoSdk: input.expoSdk ?? packageJson.dependencies.expo,
    databaseVersion: input.databaseVersion ?? migrations.at(-1)?.version ?? '—',
    seedVersion: input.seedVersion ?? seedDataVersion,
    onboardingVersion: input.onboardingVersion ?? ONBOARDING_VERSION,
    runtimeVersion: input.runtimeVersion ?? 'не встроена',
    updateChannel: input.updateChannel ?? 'не настроен',
    updateId: input.updateId ?? null,
    buildDate: input.buildDate ?? null,
    executionEnvironment: input.executionEnvironment ?? 'unknown',
  };
}

export function getBuildInfo(): BuildInfo {
  const config = Constants.expoConfig;
  const extra = (config?.extra ?? {}) as Record<string, unknown>;
  const configuredBuild = Platform.OS === 'android' ? config?.android?.versionCode : config?.ios?.buildNumber;
  return createBuildInfo({
    version: config?.version ?? packageJson.version,
    buildNumber: configuredBuild == null ? 'Expo Go / local' : String(configuredBuild),
    buildProfile: typeof extra.buildProfile === 'string' ? extra.buildProfile : (__DEV__ ? 'development' : 'production'),
    appVariant: normalizeAppVariant(extra.appVariant ?? (__DEV__ ? 'development' : 'production')),
    expoSdk: packageJson.dependencies.expo,
    runtimeVersion: Constants.expoRuntimeVersion ?? 'не встроена',
    updateChannel: typeof extra.updateChannel === 'string' ? extra.updateChannel : 'не настроен',
    updateId: typeof extra.updateId === 'string' ? extra.updateId : null,
    buildDate: typeof extra.buildDate === 'string' ? extra.buildDate : null,
    executionEnvironment: Constants.executionEnvironment,
  });
}

export function isInternalBuild(info = getBuildInfo()) {
  return __DEV__ || info.appVariant === 'development' || info.appVariant === 'preview';
}
