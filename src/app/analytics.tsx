import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { QuickAddButton, QuickAddSheet } from '@/components/QuickAddSheet';
import { useAppStore } from '@/store/appStore';
import { TabScreen } from '@/components/TabScreen';
import { mealLabels } from '@/constants/options';
import { loadHistoryAnalytics } from '@/database/repositories/analyticsRepository';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { HistoryAnalytics, MealType } from '@/types/domain';

type Period = HistoryAnalytics['periodDays'];
const periods: { value: Period; label: string }[] = [{ value: 7, label: '7 дней' }, { value: 30, label: '30 дней' }, { value: 90, label: '90 дней' }, { value: 365, label: 'Год' }];

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<HistoryAnalytics | null>(null);
  const { colors } = useTheme();
  const diaryDate=useAppStore((state)=>state.diaryDate);const[quick,setQuick]=useState(false);
  useEffect(() => { setData(null); void loadHistoryAnalytics(period).then(setData); }, [period]);
  const visibleDays = data?.caloriesByDay.slice(-30) ?? [];
  const max = Math.max(1, ...visibleDays.map((item) => item.calories));

  return <TabScreen title="Статистика" subtitle="Только данные этого устройства" headerRight={<Pressable accessibilityRole="button" accessibilityLabel="Закрыть" style={[styles.close, { backgroundColor: colors.surface }]} onPress={() => router.back()}><AppText>×</AppText></Pressable>}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{periods.map((item) => <FilterChip key={item.value} label={item.label} selected={period === item.value} onPress={() => setPeriod(item.value)} />)}</ScrollView>
    {!data ? <GlassCard><AppText tone="secondary">Собираем статистику…</AppText></GlassCard> : !data.entryCount ? <GlassCard style={styles.empty}><AppText variant="heading">История ещё формируется</AppText><AppText tone="secondary">Добавляй блюда и закрывай дни — здесь появятся средние значения, точность и динамика.</AppText></GlassCard> : <>
      <View style={styles.stats}><Stat value={Math.round(data.averageCalories).toLocaleString('ru-RU')} label="ккал в среднем" /><Stat value={`${Math.round(data.averageTargetAccuracy)}%`} label="попадание в норму" /></View>
      <View style={styles.stats}><Stat value={data.completedDays} label="дней закрыто" /><Stat value={data.longestStreak} label="лучшая серия" /></View>
      <GlassCard><View style={styles.chartTitle}><AppText variant="heading">Калории по дням</AppText>{data.caloriesByDay.length > 30 ? <AppText variant="caption" tone="muted">последние 30</AppText> : null}</View><View style={styles.chart}>{visibleDays.map((item) => <View key={item.date} style={styles.barSlot}><View style={[styles.bar, { height: Math.max(4, item.calories / max * 120), backgroundColor: item.completed ? colors.greenPrimary : colors.greenDark }]}/>{visibleDays.length <= 14 ? <AppText variant="caption" tone="muted">{item.date.slice(8)}</AppText> : null}</View>)}</View></GlassCard>
      <GlassCard><AppText variant="heading">Средние КБЖУ</AppText><View style={styles.macros}><Macro label="Белки" value={data.averageProteinG} color={colors.greenPrimary} /><Macro label="Жиры" value={data.averageFatG} color={colors.gold} /><Macro label="Углеводы" value={data.averageCarbsG} color={colors.carbs} /></View></GlassCard>
      <GlassCard><AppText variant="heading">Приёмы пищи</AppText>{(Object.keys(mealLabels) as MealType[]).map((meal) => <View key={meal} style={[styles.distribution, { borderBottomColor: colors.glassBorder }]}><AppText tone="secondary">{mealLabels[meal]}</AppText><AppText>{data.mealDistribution[meal]}</AppText></View>)}</GlassCard>
      <GlassCard variant="compact"><AppText variant="heading">За период</AppText><AppText tone="secondary">Записей: {data.entryCount} · чаще всего: {data.mostFrequentProduct ?? '—'}</AppText><AppText tone="secondary">Показатели рассчитаны только по дням, где есть записи.</AppText></GlassCard><PrimaryButtonLink label="Что замечено" onPress={()=>router.push('/personal-insights' as never)}/><QuickAddButton onPress={()=>setQuick(true)}/>
    </>}
    <QuickAddSheet visible={quick} onClose={()=>setQuick(false)} date={diaryDate}/>
  </TabScreen>;
}
function PrimaryButtonLink({label,onPress}:{label:string;onPress:()=>void}){return <Pressable onPress={onPress} style={styles.link}><AppText tone="green">{label} →</AppText></Pressable>;}

function Stat({ value, label }: { value: string | number; label: string }) { return <GlassCard variant="compact" style={styles.stat}><AppText variant="title">{value}</AppText><AppText variant="caption" tone="secondary">{label}</AppText></GlassCard>; }
function Macro({ label, value, color }: { label: string; value: number; color: string }) { return <View style={styles.macro}><View style={[styles.dot, { backgroundColor: color }]} /><AppText tone="secondary" style={styles.macroLabel}>{label}</AppText><AppText style={styles.bold}>{Math.round(value)} г</AppText></View>; }

const styles = StyleSheet.create({
  close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, chips: { gap: spacing.sm }, empty: { gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm }, stat: { flex: 1 }, chartTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chart: { height: 150, marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }, barSlot: { flex: 1, alignItems: 'center', gap: 4 }, bar: { width: '72%', borderRadius: radii.sm },
  macros: { gap: spacing.sm, marginTop: spacing.md }, macro: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, dot: { width: 10, height: 10, borderRadius: 5 }, macroLabel: { flex: 1 }, bold: { fontWeight: '700' },
  distribution: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  link:{minHeight:44,alignItems:'center',justifyContent:'center'},
});
