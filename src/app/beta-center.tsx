import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { betaChecklist } from '@/config/betaChecklist';
import { getBuildInfo, isInternalBuild } from '@/config/buildInfo';
import { inspectDevelopmentDatabase } from '@/database/repositories/developerRepository';
import { clearOnboardingResearchData, buildOnboardingResearchSummary, loadOnboardingEvents } from '@/features/onboarding/onboardingAnalytics';
import { clearBetaChecklistState, loadBetaChecklistState, saveBetaChecklistState } from '@/services/betaTesting';
import { getUiDiagnosticsSnapshot } from '@/services/uiDiagnostics';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function BetaCenterScreen() {
  const { colors, resolvedMode } = useTheme();
  const info = getBuildInfo();
  const internal = isInternalBuild(info);
  const onboardingState = useAppStore((state) => state.onboardingState);
  const performanceMode = useAppStore((state) => state.performanceMode);
  const [checked, setChecked] = useState<string[]>([]);
  const [inspection, setInspection] = useState<Awaited<ReturnType<typeof inspectDevelopmentDatabase>> | null>(null);
  const [analytics, setAnalytics] = useState<ReturnType<typeof buildOnboardingResearchSummary> | null>(null);

  const refresh = useCallback(async () => {
    const [savedChecklist, database, events] = await Promise.all([loadBetaChecklistState(), inspectDevelopmentDatabase(), loadOnboardingEvents()]);
    setChecked(savedChecklist);
    setInspection(database);
    setAnalytics(buildOnboardingResearchSummary(events));
  }, []);
  useEffect(() => { if (internal) void refresh(); }, [internal, refresh]);
  if (!internal) return <Redirect href="/(tabs)/profile" />;

  const toggle = async (id: string) => {
    const next = checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id];
    setChecked(next);
    await saveBetaChecklistState(next);
  };
  const exportTechnicalReport = async () => {
    const diagnostics = getUiDiagnosticsSnapshot();
    const report = {
      kind: 'tochka-rosta-beta-diagnostic', createdAt: new Date().toISOString(), build: info,
      technical: { route: diagnostics.currentRoute, theme: resolvedMode, performanceMode, databaseVersion: inspection?.version ?? null, products: inspection?.products ?? null, entries: inspection?.entries ?? null },
      firstMinute: { onboardingVersion: onboardingState.onboardingVersion, currentStep: onboardingState.currentStep, completedAt: onboardingState.completedAt, durationMs: onboardingState.durationMs, firstEntryCompleted: onboardingState.firstEntryCompleted, wasSkipped: onboardingState.wasSkipped, validationErrorsCount: onboardingState.validationErrorsCount, resumeCount: onboardingState.resumeCount },
      privacy: 'Имя, возраст, вес, дневник, ограничения и изображения не включены.',
    };
    await Share.share({ title: 'Технический отчёт Точки Роста', message: JSON.stringify(report, null, 2) });
  };
  const resetTest = () => Alert.alert('Сбросить только onboarding для теста?', 'Будут очищены только локальные First Minute метрики и demo-state. Реальный профиль, дневник, каталог, рецепты, Поток и SQLite останутся без изменений.', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Сбросить тест', style: 'destructive', onPress: () => { void clearOnboardingResearchData().then(() => router.push('/(onboarding)/demo' as never)); } },
  ]);

  return <TabScreen title="Beta Center" subtitle="Локальные инструменты внутреннего тестирования" fallbackRoute="/(tabs)/profile">
    <GlassCard variant="accent"><AppText variant="heading">{info.version} ({info.buildNumber})</AppText><AppText tone="secondary">{info.appVariant} · {info.buildProfile} · channel {info.updateChannel}</AppText></GlassCard>
    <GlassCard>
      <AppText variant="heading">First Minute Diagnostics</AppText>
      <AppText tone="secondary">version {onboardingState.onboardingVersion} · step {onboardingState.currentStep}</AppText>
      <AppText tone="secondary">completed {onboardingState.completedAt ?? 'нет'} · duration {onboardingState.durationMs == null ? '—' : `${Math.round(onboardingState.durationMs / 1000)} с`}</AppText>
      <AppText tone="secondary">first entry {onboardingState.firstEntryCompleted ? 'да' : 'нет'} · skipped {onboardingState.skippedSteps.join(', ') || 'нет'}</AppText>
      <AppText tone="secondary">validation errors {onboardingState.validationErrorsCount} · resumes {onboardingState.resumeCount}</AppText>
      <AppText variant="caption" tone="muted">Локальных событий: {analytics?.totalEvents ?? '—'} · последнее завершение: {analytics?.latestDurationMs == null ? '—' : `${Math.round(analytics.latestDurationMs / 1000)} с`}</AppText>
      <PrimaryButton label="Повторить изолированное демо" secondary onPress={() => router.push('/(onboarding)/demo' as never)} />
      <PrimaryButton label="Сбросить только onboarding для теста" secondary onPress={resetTest} />
    </GlassCard>
    <GlassCard>
      <AppText variant="heading">Проверка базы и Ритма</AppText>
      <AppText tone="secondary">SQLite v{inspection?.version ?? '—'} · продукты {inspection?.products ?? '—'} · записи {inspection?.entries ?? '—'}</AppText>
      <PrimaryButton label="Обновить диагностику" secondary onPress={refresh} />
      <PrimaryButton label="Проверить Ритма" secondary onPress={() => router.push('/rhythm-center' as never)} />
      {__DEV__ ? <PrimaryButton label="Расширенная диагностика" secondary onPress={() => router.push('/developer' as never)} /> : null}
    </GlassCard>
    <GlassCard>
      <AppText variant="heading">Beta Checklist</AppText>
      <AppText tone="secondary">{checked.length} из {betaChecklist.length} сценариев</AppText>
      {betaChecklist.map((item, index) => {
        const completed = checked.includes(item.id);
        return <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: completed }} accessibilityLabel={item.label} onPress={() => { void toggle(item.id); }} style={[styles.check, { borderBottomColor: colors.separator }]}>
          <View style={[styles.checkMark, { borderColor: colors.borderSubtle, backgroundColor: completed ? colors.accentPrimary : colors.transparent }]}><AppText variant="caption" style={completed ? { color: colors.backgroundPrimary } : undefined}>{completed ? '✓' : index + 1}</AppText></View>
          <AppText style={styles.flex}>{item.label}</AppText>
        </Pressable>;
      })}
      <PrimaryButton label="Сбросить отметки чеклиста" secondary disabled={!checked.length} onPress={async () => { await clearBetaChecklistState(); setChecked([]); }} />
    </GlassCard>
    <GlassCard>
      <AppText variant="heading">Отчёт тестировщика</AppText><AppText tone="secondary">Форма и экспорт работают локально, без backend.</AppText>
      <PrimaryButton label="Заполнить обратную связь" onPress={() => router.push('/beta-feedback' as never)} />
      <PrimaryButton label="Экспортировать технический отчёт" secondary onPress={exportTechnicalReport} />
    </GlassCard>
    <AppText variant="caption" tone="muted">Beta Center не содержит действий, очищающих реальные пользовательские данные.</AppText>
  </TabScreen>;
}

const styles = StyleSheet.create({
  check: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth }, checkMark: { width: 32, height: 32, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, flex: { flex: 1 },
});
