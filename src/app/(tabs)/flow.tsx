import { useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { FlowFlame } from '@/components/FlowFlame';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import { getLocalDateKey } from '@/utils/date';

const milestones = [3, 7, 14, 30, 60, 100];
export default function FlowScreen() {
  const flow = useAppStore((state) => state.flow); const refresh = useAppStore((state) => state.refreshFlow); const name = useUserDisplayName(); const { colors } = useTheme();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const days = useMemo(() => { const today = new Date(); const year = today.getFullYear(); const month = today.getMonth(); const first = new Date(year, month, 1); const padding = (first.getDay() + 6) % 7; const count = new Date(year, month + 1, 0).getDate(); return [...Array<string | null>(padding).fill(null), ...Array.from({ length: count }, (_, index) => getLocalDateKey(new Date(year, month, index + 1)))]; }, []);
  const streak = flow?.currentStreak ?? 0; const next = milestones.find((value) => value > streak) ?? 100; const nextProgress = Math.min(1, streak / next);
  return <TabScreen title="Поток" subtitle="Регулярность важнее идеальности">
    <GlassCard variant="accent" style={styles.hero}><FlowFlame streak={streak} /><AppText variant="display">{streak} {streak === 1 ? 'день' : 'дней'}</AppText><AppText tone="secondary" style={styles.center}>{streak ? `${name ? `${name}, т` : 'Т'}ы поддерживаешь текущую серию.` : 'Закрой день в дневнике, чтобы зажечь свой Поток.'}</AppText><View style={[styles.progress, { backgroundColor: colors.greenDark }]}><View style={[styles.progressFill, { width: `${nextProgress * 100}%`, backgroundColor: colors.greenBright }]} /></View><AppText variant="caption" tone="muted">Следующая точка пути — {next} дней</AppText></GlassCard>
    <View style={styles.stats}><GlassCard variant="compact" style={styles.stat}><AppText variant="title">{flow?.longestStreak ?? 0}</AppText><AppText variant="caption" tone="secondary">лучшая серия</AppText></GlassCard><GlassCard variant="compact" style={styles.stat}><AppText variant="title">{flow?.completedDays ?? 0}</AppText><AppText variant="caption" tone="secondary">дней закрыто</AppText></GlassCard></View>
    <GlassCard><AppText variant="heading">Этот месяц</AppText><View style={styles.week}>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((day) => <AppText key={day} variant="caption" tone="muted" style={styles.day}>{day}</AppText>)}</View><View style={styles.calendar}>{days.map((date, index) => { const completed = Boolean(date && flow?.completedDates.includes(date)); return <View key={`${date}-${index}`} style={[styles.cell, completed && { backgroundColor: colors.greenGlow, borderColor: colors.glassBorderStrong, borderWidth: 1 }]}>{date ? <AppText variant="caption" tone={completed ? 'green' : 'secondary'}>{Number(date.slice(8))}</AppText> : null}</View>; })}</View></GlassCard>
    <GlassCard><View style={styles.headingRow}><AppText variant="heading">Точки пути</AppText><AppText variant="caption" tone="green">следующая — {next}</AppText></View><View style={styles.road}>{milestones.map((day) => { const done = (flow?.longestStreak ?? 0) >= day; return <View key={day} style={[styles.point, { borderColor: done ? colors.glassBorderStrong : colors.glassBorder, backgroundColor: done ? colors.greenGlow : colors.transparent }]}><AppText variant="caption" tone={done ? 'green' : 'muted'}>{day}</AppText></View>; })}</View></GlassCard>
    <GlassCard variant="compact"><AppText variant="heading">Мягкое правило</AppText><AppText tone="secondary">Сегодня — новая возможность. Если серия прервалась, прошлый прогресс и лучшая серия остаются с тобой.</AppText></GlassCard>
    <PrimaryButton label="Открыть статистику" secondary onPress={() => router.push('/analytics' as never)} />
  </TabScreen>;
}

const styles = StyleSheet.create({ hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }, center: { textAlign: 'center' }, progress: { width: '100%', height: 8, borderRadius: radii.pill, overflow: 'hidden', marginTop: spacing.sm }, progressFill: { height: '100%', borderRadius: radii.pill }, stats: { flexDirection: 'row', gap: spacing.sm }, stat: { flex: 1, alignItems: 'center' }, week: { flexDirection: 'row', marginTop: spacing.md }, day: { width: `${100/7}%`, textAlign: 'center' }, calendar: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }, cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill }, headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, road: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }, point: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 } });
