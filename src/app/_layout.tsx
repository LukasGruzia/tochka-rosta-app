import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PerformanceOverlay } from '@/components/PerformanceOverlay';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import { migrations } from '@/database/schema';
import { buildTechnicalReport, getUiDiagnosticsSnapshot, recordRoute, recordUiAction } from '@/services/uiDiagnostics';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { setPerformanceMetric } from '@/performance/performanceLogger';
import { useRenderTracker } from '@/performance/renderTracker';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useRenderTracker('RootLayout');
  const initialize = useAppStore((state) => state.initialize);
  useEffect(() => {
    recordUiAction('database_request_started', 'initialize_database');
    void initialize().finally(() => {
      recordUiAction('database_request_completed', 'initialize_database');
      void SplashScreen.hideAsync();
    });
  }, [initialize]);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <FeatureFlagsProvider>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </FeatureFlagsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  useRenderTracker('ThemedStack');
  const { colors, isDark } = useTheme();
  return (
    <>
      <RouteDiagnostics />
      <PerformanceOverlay />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.backgroundPrimary }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

function RouteDiagnostics() {
  const pathname = usePathname();
  useEffect(() => { recordRoute(pathname); setPerformanceMetric('activeRoute', pathname); }, [pathname]);
  return null;
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const { resolvedMode } = useTheme();
  const setPerformanceMode = useAppStore((state) => state.setPerformanceMode);
  const databaseVersion = migrations[migrations.length - 1]?.version ?? 'unknown';
  const report = buildTechnicalReport({ theme: resolvedMode, databaseVersion, component: 'ExpoRouterRoot', error });
  recordUiAction('error_occurred', 'route_error_boundary', error.message);
  return (
    <AppBackground>
      <View style={styles.error}>
        <AppText variant="title">Что-то пошло не так</AppText>
        <AppText tone="secondary">Экран не удалось открыть. Данные на устройстве не изменены.</AppText>
        <PrimaryButton label="Попробовать снова" onPress={retry} />
        <PrimaryButton label="Вернуться на главную" secondary onPress={() => router.replace('/(tabs)')} />
        <PrimaryButton label="Включить безопасный режим" secondary onPress={async () => { await setPerformanceMode('safe'); retry(); }} />
        <PrimaryButton label="Скопировать технические данные" secondary onPress={async () => { await Clipboard.setStringAsync(report); }} />
        {__DEV__ ? <View style={styles.technical}>
          <AppText variant="caption" tone="muted">route: {getUiDiagnosticsSnapshot().currentRoute}</AppText>
          <AppText variant="caption" tone="muted">component: ExpoRouterRoot</AppText>
          <AppText variant="caption" tone="warning">{error.message}</AppText>
          <AppText variant="caption" tone="muted">theme: {resolvedMode} · database: {databaseVersion}</AppText>
          <AppText variant="caption" tone="muted">last button: {getUiDiagnosticsSnapshot().lastPressedButton ?? 'none'}</AppText>
          <AppText variant="caption" tone="muted">{error.stack}</AppText>
        </View> : null}
      </View>
    </AppBackground>
  );
}
const styles = StyleSheet.create({ root:{flex:1},error: { flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.lg }, technical: { maxHeight: 260, gap: spacing.xs } });
