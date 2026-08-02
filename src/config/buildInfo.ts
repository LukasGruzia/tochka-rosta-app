import { Platform } from 'react-native';
import Constants from 'expo-constants';
import packageJson from '../../package.json';
import { migrations } from '@/database/schema';
import { seedDataVersion } from '@/database/database';
import { ONBOARDING_VERSION } from '@/features/onboarding/onboardingState';
import { createBuildInfo, normalizeAppVariant, type BuildInfo } from './buildInfoCore';

export { createBuildInfo, normalizeAppVariant } from './buildInfoCore';
export type { AppVariant, BuildInfo } from './buildInfoCore';

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
    databaseVersion: migrations.at(-1)?.version ?? '—',
    seedVersion: seedDataVersion,
    onboardingVersion: ONBOARDING_VERSION,
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
