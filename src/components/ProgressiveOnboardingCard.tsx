import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { getSetting, setSetting } from '@/database/repositories/settingsRepository';
import { shouldShowProgressivePrompt } from '@/services/progressiveOnboarding';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';

const KEY = 'progressive_prompt_favorites_dismissed_at';

export function ProgressiveOnboardingCard({ entryCount }: { entryCount: number }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    void getSetting(KEY).then((dismissedAt) => { if (active) setVisible(shouldShowProgressivePrompt(entryCount, dismissedAt)); });
    return () => { active = false; };
  }, [entryCount]);
  if (!visible) return null;
  const dismiss = async () => {
    setVisible(false);
    await setSetting(KEY, new Date().toISOString());
  };
  return <GlassCard variant="compact">
    <View style={styles.header}><View style={styles.copy}><AppText variant="heading">Добавить любимые продукты</AppText><AppText tone="secondary">Избранное сделает следующие записи ещё быстрее.</AppText></View><AppPressable accessibilityRole="button" accessibilityLabel="Скрыть подсказку" onPress={dismiss} style={[styles.close, { backgroundColor: colors.surfaceInteractive }]}><View style={styles.closeContent}><AppText>×</AppText></View></AppPressable></View>
    <PrimaryButton label="Открыть каталог" secondary onPress={() => router.push('/(tabs)/catalog')} />
  </GlassCard>;
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, copy: { flex: 1, gap: spacing.xs }, close: { width: 44, height: 44, borderRadius: radii.pill }, closeContent: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
