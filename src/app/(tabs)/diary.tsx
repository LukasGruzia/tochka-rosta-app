import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { TabScreen } from '@/components/TabScreen';
import { mealLabels } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import { colors, spacing } from '@/theme/tokens';

export default function DiaryScreen() {
  const diary = useAppStore((state) => state.diary);
  const refresh = useAppStore((state) => state.refreshDiary);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const consumed = Math.round(diary?.consumedCalories ?? 0);
  const target = Math.round(diary?.targetCalories ?? 0);
  return <TabScreen title="Дневник" subtitle="Сегодняшние приёмы пищи и дневной баланс.">
    <GlassCard variant="accent" style={styles.hero}><ProgressRing size={150} progress={target ? consumed / target : 0} value={String(consumed)} label={`из ${target} ккал`} /></GlassCard>
    {!diary?.entries.length ? <GlassCard variant="default" style={styles.empty}><AppText variant="heading">Пока здесь тихо</AppText><AppText tone="secondary" style={styles.center}>Добавь первое блюдо из каталога — дневной баланс обновится автоматически.</AppText><PrimaryButton label="Открыть каталог" onPress={() => router.push('/(tabs)/catalog')} /></GlassCard> :
      diary.entries.map((entry) => <GlassCard key={entry.id} variant="compact" style={styles.entry}><View style={styles.entryCopy}><AppText style={styles.name}>{entry.productName}</AppText><AppText variant="caption" tone="secondary">{mealLabels[entry.mealType]} · {entry.proteinG} Б / {entry.fatG} Ж / {entry.carbsG} У</AppText></View><AppText tone="green">{Math.round(entry.calories)} ккал</AppText></GlassCard>)}
    <AppText variant="caption" tone="muted">Удаление и детальное редактирование порций появятся на втором этапе.</AppText>
  </TabScreen>;
}
const styles = StyleSheet.create({ hero: { alignItems: 'center' }, empty: { alignItems: 'center', gap: spacing.md }, center: { textAlign: 'center' }, entry: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.greenPrimary }, entryCopy: { flex: 1, gap: 4 }, name: { fontWeight: '700' } });
