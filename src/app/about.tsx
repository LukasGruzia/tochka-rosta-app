import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { getBuildInfo, isInternalBuild } from '@/config/buildInfo';
import { performanceModeLabels } from '@/config/performance';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const variantLabels = { development: 'Development', preview: 'Beta', production: 'Production' } as const;

export default function AboutScreen() {
  const { colors } = useTheme();
  const performanceMode = useAppStore((state) => state.performanceMode);
  const info = getBuildInfo();
  const internal = isInternalBuild(info);
  return <TabScreen title="О приложении" subtitle="Версия и локальная среда" fallbackRoute="/(tabs)/profile">
    {info.appVariant === 'preview' ? <View style={[styles.badge, { backgroundColor: colors.goldAccent }]}><AppText variant="caption" style={{ color: colors.backgroundPrimary }}>ПРЕДВАРИТЕЛЬНАЯ ВЕРСИЯ</AppText></View> : null}
    <GlassCard variant="accent">
      <AppText variant="title">Точка Роста</AppText>
      <AppText tone="secondary">Сила в балансе</AppText>
      <AppText variant="caption" tone="green">{variantLabels[info.appVariant]}</AppText>
    </GlassCard>
    <GlassCard variant="compact">
      <InfoRow label="Версия" value={info.version} />
      <InfoRow label="Номер сборки" value={info.buildNumber} />
      <InfoRow label="Build profile" value={info.buildProfile} />
      <InfoRow label="App variant" value={info.appVariant} />
      <InfoRow label="Expo SDK" value={info.expoSdk} />
      <InfoRow label="SQLite schema" value={String(info.databaseVersion)} />
      <InfoRow label="Seed" value={info.seedVersion} />
      <InfoRow label="Onboarding" value={String(info.onboardingVersion)} />
      <InfoRow label="Runtime" value={info.runtimeVersion} />
      <InfoRow label="Update channel" value={info.updateChannel} />
      <InfoRow label="Update ID" value={info.updateId ?? 'не настроен'} />
      <InfoRow label="Дата сборки" value={info.buildDate ?? 'не встроена'} />
      <InfoRow label="Эффекты" value={performanceModeLabels[performanceMode]} />
    </GlassCard>
    <AppText variant="caption" tone="secondary">Expo Go показывает локальные значения сборки. Standalone Beta получает их из встроенного app config.</AppText>
    {internal ? <PrimaryButton label="Открыть Beta Center" secondary onPress={() => router.push('/beta-center' as never)} /> : null}
  </TabScreen>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return <View style={[styles.row, { borderBottomColor: colors.separator }]}><AppText variant="caption" tone="secondary">{label}</AppText><AppText variant="caption" style={styles.value} selectable>{value}</AppText></View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radii.pill },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth }, value: { flex: 1, textAlign: 'right' },
});
