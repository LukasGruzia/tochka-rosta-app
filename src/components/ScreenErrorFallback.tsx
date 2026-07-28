import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { currentDatabaseVersion } from '@/database/schema';
import { recordPerformanceEvent } from '@/performance/performanceLogger';
import { buildTechnicalReport } from '@/services/uiDiagnostics';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

import { AppBackground } from './AppBackground';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';

type ScreenErrorFallbackProps = {
  error: Error;
  retry: () => void;
  section: string;
};

export function ScreenErrorFallback({ error, retry, section }: ScreenErrorFallbackProps) {
  const { resolvedMode } = useTheme();
  const { setSafeMode } = useFeatureFlags();

  recordPerformanceEvent('error', `${section}:${error.message}`);
  const report = buildTechnicalReport({
    theme: resolvedMode,
    databaseVersion: currentDatabaseVersion,
    component: section,
    error,
  });

  const copyReport = async () => {
    await Clipboard.setStringAsync(report);
  };

  return (
    <AppBackground>
      <View style={styles.root}>
        <AppText variant="title">Не удалось открыть этот раздел</AppText>
        <AppText tone="secondary">
          Данные на устройстве не очищены. Можно повторить открытие или перейти на главную.
        </AppText>
        <PrimaryButton label="Попробовать снова" onPress={retry} />
        <PrimaryButton
          label="Вернуться на главную"
          secondary
          onPress={() => router.replace('/(tabs)')}
        />
        <PrimaryButton
          label="Включить безопасный режим"
          secondary
          onPress={() => {
            setSafeMode(true);
            retry();
          }}
        />
        <PrimaryButton
          label="Скопировать техническую информацию"
          secondary
          onPress={copyReport}
        />
        {__DEV__ ? (
          <View style={styles.stack}>
            <AppText variant="caption" tone="warning">
              {error.message}
            </AppText>
            <AppText variant="caption" tone="muted">
              {error.stack}
            </AppText>
          </View>
        ) : null}
      </View>
    </AppBackground>
  );
}

export function createSectionErrorBoundary(section: string) {
  return function SectionErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
    return <ScreenErrorFallback error={error} retry={retry} section={section} />;
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  stack: {
    maxHeight: 240,
    gap: spacing.xs,
  },
});
