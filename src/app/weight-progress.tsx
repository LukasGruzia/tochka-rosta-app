import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { FormField } from '@/components/FormField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { deleteWeightLog, loadWeightProgress, saveWeightLog } from '@/database/repositories/weightRepository';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { WeightLog, WeightProgress } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';

type Period = 30 | 90 | 365 | 0;
const empty: WeightProgress = { entries: [], initialWeight: null, currentWeight: null, changeKg: 0, minWeight: null, maxWeight: null };

function fromDate(period: Period) {
  if (!period) return undefined;
  const date = new Date();
  date.setDate(date.getDate() - period + 1);
  return getLocalDateKey(date);
}

export default function WeightProgressScreen() {
  const profile = useAppStore((state) => state.profile);
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>(90);
  const [progress, setProgress] = useState<WeightProgress>(empty);
  const [editing, setEditing] = useState<WeightLog | null | undefined>(undefined);
  const [date, setDate] = useState(getLocalDateKey());
  const [weight, setWeight] = useState(String(profile?.weightKg ?? 70));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const refresh = useCallback(async () => setProgress(await loadWeightProgress(fromDate(period))), [period]);
  useEffect(() => { void refresh(); }, [refresh]);

  const open = (entry?: WeightLog) => {
    setEditing(entry ?? null); setDate(entry?.date ?? getLocalDateKey()); setWeight(String(entry?.weightKg ?? progress.currentWeight ?? profile?.weightKg ?? 70)); setNote(entry?.note ?? '');
  };
  const save = async () => {
    const parsed = Number(weight.replace(',', '.'));
    try {
      setSaving(true); await saveWeightLog({ id: editing?.id, date, weightKg: parsed, note }); await refresh(); setEditing(undefined);
    } catch (error) { Alert.alert('Проверь запись', error instanceof Error ? error.message : 'Не удалось сохранить вес.'); }
    finally { setSaving(false); }
  };
  const remove = (entry: WeightLog) => Alert.alert('Удалить запись?', `${entry.date} · ${entry.weightKg} кг`, [
    { text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => { void deleteWeightLog(entry.id).then(refresh); } },
  ]);

  const changeLabel = progress.entries.length > 1 ? `${progress.changeKg > 0 ? '+' : ''}${progress.changeKg.toFixed(1)} кг` : '—';
  return <TabScreen title="История веса" subtitle="Локальные записи и динамика" headerRight={<Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}><AppText>×</AppText></Pressable>}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <FilterChip label="30 дней" selected={period === 30} onPress={() => setPeriod(30)} /><FilterChip label="90 дней" selected={period === 90} onPress={() => setPeriod(90)} /><FilterChip label="Год" selected={period === 365} onPress={() => setPeriod(365)} /><FilterChip label="Всё время" selected={period === 0} onPress={() => setPeriod(0)} />
    </ScrollView>
    <View style={styles.stats}><GlassCard variant="compact" style={styles.stat}><AppText variant="title">{progress.currentWeight?.toLocaleString('ru-RU') ?? profile?.weightKg ?? '—'}</AppText><AppText variant="caption" tone="secondary">текущий вес, кг</AppText></GlassCard><GlassCard variant="compact" style={styles.stat}><AppText variant="title" tone={progress.changeKg <= 0 ? 'green' : 'warning'}>{changeLabel}</AppText><AppText variant="caption" tone="secondary">изменение</AppText></GlassCard></View>
    <GlassCard><View style={styles.chartHeader}><AppText variant="heading">Динамика</AppText><AppText variant="caption" tone="muted">{progress.entries.length} записей</AppText></View><WeightChart entries={progress.entries} color={colors.greenPrimary} muted={colors.textMuted} /></GlassCard>
    <PrimaryButton label="Добавить вес" onPress={() => open()} />
    {progress.entries.length ? <GlassCard variant="compact"><AppText variant="heading">Записи</AppText>{[...progress.entries].reverse().map((entry) => <Pressable key={entry.id} onPress={() => open(entry)} onLongPress={() => remove(entry)} style={[styles.entry, { borderBottomColor: colors.glassBorder }]}><View style={styles.entryCopy}><AppText style={styles.bold}>{entry.weightKg.toLocaleString('ru-RU')} кг</AppText><AppText variant="caption" tone="secondary">{entry.date}{entry.note ? ` · ${entry.note}` : ''}</AppText></View><AppText tone="muted">›</AppText></Pressable>)}</GlassCard> : <GlassCard><AppText variant="heading">Начни с первой точки</AppText><AppText tone="secondary">Добавь вес сегодня. График и изменение появятся после следующих записей.</AppText></GlassCard>}

    <Modal visible={editing !== undefined} transparent animationType="slide" onRequestClose={() => setEditing(undefined)}>
      <View style={[styles.scrim, { backgroundColor: colors.blackScrim }]}><View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.glassBorder }]}>
        <View style={styles.sheetHead}><AppText variant="heading">{editing ? 'Изменить запись' : 'Новый вес'}</AppText><Pressable onPress={() => setEditing(undefined)}><AppText>×</AppText></Pressable></View>
        <FormField label="Дата" value={date} onChangeText={setDate} placeholder="ГГГГ-ММ-ДД" />
        <FormField label="Вес" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="кг" />
        <FormField label="Заметка" value={note} onChangeText={setNote} placeholder="Необязательно" />
        <PrimaryButton label={saving ? 'Сохраняем…' : 'Сохранить'} disabled={saving} onPress={save} />
        {editing ? <PrimaryButton label="Удалить запись" secondary onPress={() => { const item = editing; setEditing(undefined); remove(item); }} /> : null}
      </View></View>
    </Modal>
  </TabScreen>;
}

function WeightChart({ entries, color, muted }: { entries: WeightLog[]; color: string; muted: string }) {
  const width = 310; const height = 150; const padding = 14;
  const points = useMemo(() => {
    if (!entries.length) return [];
    const values = entries.map((entry) => entry.weightKg); const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
    return entries.map((entry, index) => ({ x: entries.length === 1 ? width / 2 : padding + index / (entries.length - 1) * (width - padding * 2), y: padding + (max - entry.weightKg) / range * (height - padding * 2) }));
  }, [entries]);
  if (!points.length) return <View style={styles.chartEmpty}><AppText tone="muted">График появится после первой записи</AppText></View>;
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return <View style={styles.chartWrap}><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Path d={path} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />{points.map((point, index) => <Circle key={index} cx={point.x} cy={point.y} r={4} fill={color} stroke={muted} strokeWidth={1} />)}</Svg></View>;
}

const styles = StyleSheet.create({
  close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, chips: { gap: spacing.sm }, stats: { flexDirection: 'row', gap: spacing.sm }, stat: { flex: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chartWrap: { alignItems: 'center', marginTop: spacing.md }, chartEmpty: { height: 150, alignItems: 'center', justifyContent: 'center' },
  entry: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth }, entryCopy: { flex: 1, gap: 2 }, bold: { fontWeight: '700' },
  scrim: { flex: 1, justifyContent: 'flex-end' }, sheet: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
