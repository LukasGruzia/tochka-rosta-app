import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AvatarPicker } from '@/components/AvatarPicker';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { ProfileMenuRow, ProfileMenuSection } from '@/components/ProfileMenuSection';
import { ProfileStatCard } from '@/components/ProfileStatCard';
import { TabScreen } from '@/components/TabScreen';
import { goalLabels } from '@/constants/options';
import { loadProfileOverview } from '@/database/repositories/analyticsRepository';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { performanceModeLabels } from '@/config/performance';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { createSectionErrorBoundary } from '@/components/ScreenErrorFallback';
import { useRenderTracker } from '@/performance/renderTracker';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getProfileAvatarSize } from '@/services/avatarLayout';

export const ErrorBoundary = createSectionErrorBoundary('ProfileScreen');

export default function ProfileScreen() {
  useRenderTracker('ProfileScreen');
  const { profile, avatarUri, avatarCacheKey, userName, updateAvatar } = useUserProfile();
  const flow = useAppStore((state) => state.flow);
  const themeMode = useAppStore((state) => state.themeMode);
  const reset = useAppStore((state) => state.reset);
  const { performanceMode } = useFeatureFlags();
  const { width } = useWindowDimensions();
  const avatarSize = getProfileAvatarSize(width);
  const [overview, setOverview] = useState({ trackedDays: 0, entryCount: 0, currentWeight: null as number | null });

  useEffect(() => {
    let active = true;
    void loadProfileOverview().then((next) => {
      if (active) setOverview(next);
    }).catch((error) => { if (__DEV__) console.warn('[ProfileScreen] overview', error); });
    return () => { active = false; };
  }, []);

  if (!profile) return <TabScreen title="Профиль"><AppText tone="secondary">Профиль ещё не создан.</AppText></TabScreen>;
  const weight = overview.currentWeight ?? profile.weightKg;
  const themeLabel = themeMode === 'system' ? 'Как в системе' : themeMode === 'dark' ? 'Тёмная' : 'Светлая';
  const confirmReset = () => Alert.alert(
    'Сбросить приложение?',
    'Все локальные данные, профиль, фото и прогресс будут удалены с этого устройства.',
    [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: () => { void reset().then(() => router.replace('/(onboarding)/welcome')); } },
    ],
  );

  return <TabScreen title="Профиль" subtitle="Личные данные и прогресс">
    <View style={styles.header}>
      <AvatarPicker name={userName} uri={avatarUri} cacheKey={avatarCacheKey} size={avatarSize} onChange={updateAvatar} />
      <AppText variant="title" numberOfLines={2} style={styles.name}>{userName}</AppText>
      <AppText tone="secondary">{goalLabels[profile.goal]} · {weight.toLocaleString('ru-RU')} кг</AppText>
    </View>

    <View style={styles.stats}>
      <ProfileStatCard value={flow?.currentStreak ?? 0} label="дней в потоке" />
      <ProfileStatCard value={overview.trackedDays} label="дней с записями" />
      <ProfileStatCard value={overview.entryCount} label="приёмов добавлено" />
    </View>

    <GlassCard variant="accent" onPress={() => router.push('/analytics' as never)} accessibilityLabel="Открыть статистику">
      <View style={styles.insight}><View style={styles.insightCopy}><AppText variant="heading">Твой прогресс</AppText><AppText tone="secondary">Калории, КБЖУ, регулярность и динамика по периодам.</AppText></View><AppText tone="green" style={styles.arrow}>›</AppText></View>
    </GlassCard>

    <ProfileMenuSection title="Прогресс">
      <ProfileMenuRow icon="◒" label="Статистика" onPress={() => router.push('/analytics' as never)} />
      <ProfileMenuRow icon="⌁" label="Что замечено" onPress={() => router.push('/personal-insights' as never)} />
      <ProfileMenuRow icon="↘" label="История веса" value={`${weight.toLocaleString('ru-RU')} кг`} onPress={() => router.push('/weight-progress' as never)} />
    </ProfileMenuSection>

    <ProfileMenuSection title="Личные данные">
      <ProfileMenuRow icon="◉" label="Данные и цель" onPress={() => router.push('/edit-profile')} />
      <ProfileMenuRow icon="◎" label="Дневная норма" value="КБЖУ" onPress={() => router.push('/edit-profile')} />
      <ProfileMenuRow icon="₽" label="Бюджет питания" onPress={() => router.push('/nutrition-budget' as never)} />
      <ProfileMenuRow icon="▤" label="Моя неделя" onPress={() => router.push('/my-week' as never)} />
    </ProfileMenuSection>

    <ProfileMenuSection title="Приложение">
      <ProfileMenuRow icon="◐" label="Оформление" value={themeLabel} onPress={() => router.push('/appearance' as never)} />
      <ProfileMenuRow icon="◇" label="Качество эффектов" value={performanceModeLabels[performanceMode]} onPress={() => router.push('/performance-effects' as never)} />
      <ProfileMenuRow icon="▦" label="Источники данных" onPress={() => router.push('/data-sources' as never)} />
      <ProfileMenuRow icon="⇅" label="Резервная копия" onPress={() => router.push('/data-management' as never)} />
      {__DEV__ ? <ProfileMenuRow icon="⌘" label="Диагностика" onPress={() => router.push('/developer' as never)} /> : null}
      {__DEV__ ? <ProfileMenuRow icon="⌁" label="Performance Diagnostics" onPress={() => router.push('/performance-diagnostics' as never)} /> : null}
    </ProfileMenuSection>

    <ProfileMenuSection title="Другое">
      <ProfileMenuRow icon="!" label="Сбросить данные" danger onPress={confirmReset} />
    </ProfileMenuSection>
    <AppText variant="caption" tone="muted" style={styles.version}>Точка Роста · APP v0.3 · данные хранятся локально</AppText>
  </TabScreen>;
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm, paddingBottom: spacing.sm }, name: { width: '100%', marginTop: spacing.sm, textAlign: 'center', flexShrink: 1 },
  stats: { flexDirection: 'row', gap: spacing.sm }, insight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, insightCopy: { flex: 1, gap: spacing.xs }, arrow: { fontSize: 34 },
  version: { textAlign: 'center', paddingVertical: spacing.md },
});
