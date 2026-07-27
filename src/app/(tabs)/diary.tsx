import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { MacroProgress } from '@/components/MacroProgress';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { TabScreen } from '@/components/TabScreen';
import { mealLabels } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';
import type { DiaryEntry, MealType } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';

const mealOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
function shiftDate(date: string, amount: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + amount); return getLocalDateKey(value); }
function formatDate(date: string) { const today = getLocalDateKey(); if (date === today) return 'Сегодня'; if (date === shiftDate(today, -1)) return 'Вчера'; if (date === shiftDate(today, 1)) return 'Завтра'; return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`)); }

export default function DiaryScreen() {
  const diary = useAppStore((state) => state.diary);
  const diaryDate = useAppStore((state) => state.diaryDate);
  const refresh = useAppStore((state) => state.refreshDiary);
  const setDate = useAppStore((state) => state.setDiaryDate);
  const closeDay = useAppStore((state) => state.closeDay);
  const editEntry = useAppStore((state) => state.editDiaryEntry);
  const removeEntry = useAppStore((state) => state.removeDiaryEntry);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const consumed = diary?.consumedCalories ?? 0; const target = diary?.targetCalories ?? 0;
  const remaining = Math.round(target - consumed);
  const complete = () => Alert.alert('Закрыть день?', 'После закрытия записи этого дня нельзя будет изменить.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Закрыть', onPress: async () => { try { await closeDay(); Alert.alert('День закрыт', 'Поток обновлён — отличная работа.'); } catch (error) { Alert.alert('Не удалось закрыть день', error instanceof Error ? error.message : 'Попробуй ещё раз'); } } }]);
  return <>
    <TabScreen title="Дневник" subtitle="Питание и дневной баланс">
      <View style={styles.dateNav}><Pressable style={styles.arrow} onPress={() => void setDate(shiftDate(diaryDate, -1))}><AppText>‹</AppText></Pressable><Pressable onPress={() => void setDate(getLocalDateKey())} style={styles.dateCopy}><AppText variant="heading">{formatDate(diaryDate)}</AppText><AppText variant="caption" tone="muted">{diaryDate}</AppText></Pressable><Pressable style={styles.arrow} onPress={() => void setDate(shiftDate(diaryDate, 1))}><AppText>›</AppText></Pressable></View>
      <GlassCard variant="accent" style={styles.hero}><ProgressRing size={144} progress={target ? consumed / target : 0} value={String(Math.round(consumed))} label={`из ${Math.round(target)} ккал`}/><AppText tone={remaining >= 0 ? 'secondary' : 'warning'}>{remaining >= 0 ? `Осталось ${remaining} ккал` : `Сверх цели ${Math.abs(remaining)} ккал`}</AppText><View style={styles.macroGrid}><MacroProgress label="Б" value={diary?.consumedProteinG ?? 0} target={diary?.targetProteinG ?? 0}/><MacroProgress label="Ж" value={diary?.consumedFatG ?? 0} target={diary?.targetFatG ?? 0} color={colors.gold}/><MacroProgress label="У" value={diary?.consumedCarbsG ?? 0} target={diary?.targetCarbsG ?? 0} color="#60A5FA"/></View></GlassCard>
      {diary?.isCompleted ? <GlassCard variant="compact" selected><AppText variant="heading" tone="green">✓ День закрыт</AppText><AppText tone="secondary">Записи сохранены в истории Потока.</AppText></GlassCard> : null}
      {mealOrder.map((meal) => { const entries = diary?.entries.filter((entry) => entry.mealType === meal) ?? []; const mealCalories = entries.reduce((sum, entry) => sum + entry.calories, 0); return <GlassCard key={meal} variant="compact" style={styles.meal}>
        <View style={styles.mealHeader}><View><AppText variant="heading">{mealLabels[meal]}</AppText><AppText variant="caption" tone="muted">{Math.round(mealCalories)} ккал</AppText></View>{!diary?.isCompleted ? <Pressable accessibilityLabel={`Добавить в ${mealLabels[meal]}`} style={styles.addButton} onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { meal } })}><AppText tone="green">＋</AppText></Pressable> : null}</View>
        {!entries.length ? <AppText tone="muted">Пока ничего не добавлено</AppText> : entries.map((entry) => <Pressable key={entry.id} disabled={diary?.isCompleted} style={styles.entry} onPress={() => setSelected(entry)}><View style={styles.entryCopy}><AppText style={styles.entryName}>{entry.productName}</AppText><AppText variant="caption" tone="secondary">{Math.round(entry.quantityG)} г · Б {entry.proteinG == null ? '—' : entry.proteinG.toFixed(1)} · Ж {entry.fatG == null ? '—' : entry.fatG.toFixed(1)} · У {entry.carbsG == null ? '—' : entry.carbsG.toFixed(1)}</AppText></View><AppText tone="green">{Math.round(entry.calories)}</AppText></Pressable>)}
      </GlassCard>; })}
      {!diary?.isCompleted && diaryDate <= getLocalDateKey() ? <PrimaryButton label="Закрыть день" disabled={!diary?.entries.length} onPress={complete}/> : null}
      <AppText variant="caption" tone="muted">Цель рассчитывается по данным профиля. История хранится локально на устройстве.</AppText>
    </TabScreen>
    <EntryEditor entry={selected} onClose={() => setSelected(null)} onSave={async (entry, meal, grams) => { await editEntry(entry.id, meal, grams / entry.servingSizeG, grams); setSelected(null); }} onDelete={(entry) => Alert.alert('Удалить запись?', entry.productName, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: async () => { await removeEntry(entry.id); setSelected(null); } }])}/>
  </>;
}

function EntryEditor({ entry, onClose, onSave, onDelete }: { entry: DiaryEntry | null; onClose: () => void; onSave: (entry: DiaryEntry, meal: MealType, grams: number) => Promise<void>; onDelete: (entry: DiaryEntry) => void }) {
  const [meal, setMeal] = useState<MealType>('snack'); const [quantity, setQuantity] = useState('100'); const [saving, setSaving] = useState(false);
  useEffect(() => { if (entry) { setMeal(entry.mealType); setQuantity(String(Math.round(entry.quantityG))); } }, [entry]);
  if (!entry) return null; const grams = Number(quantity.replace(',', '.')) || 0;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.scrim} onPress={onClose}/><View style={styles.sheet}><ScrollView contentContainerStyle={styles.sheetContent}><AppText variant="heading">Изменить запись</AppText><AppText tone="secondary">{entry.productName}</AppText><View style={styles.chips}>{mealOrder.map((item) => <FilterChip key={item} label={mealLabels[item]} selected={meal === item} onPress={() => setMeal(item)}/>)}</View><View style={styles.quantity}><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.input}/><AppText tone="secondary">г</AppText></View><PrimaryButton label={saving ? 'Сохраняем…' : 'Сохранить'} disabled={saving || grams <= 0} onPress={async () => { try { setSaving(true); await onSave(entry, meal, grams); } finally { setSaving(false); } }}/><PrimaryButton label="Удалить запись" secondary onPress={() => onDelete(entry)}/><PrimaryButton label="Отмена" secondary onPress={onClose}/></ScrollView></View></Modal>;
}

const styles = StyleSheet.create({ dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.surface }, dateCopy: { alignItems: 'center' }, hero: { alignItems: 'center', gap: spacing.md }, macroGrid: { width: '100%', flexDirection: 'row', gap: spacing.sm }, meal: { gap: spacing.md }, mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, addButton: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenGlow }, entry: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.glassBorder, paddingTop: spacing.sm }, entryCopy: { flex: 1, gap: 3 }, entryName: { fontWeight: '700' }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.blackScrim }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, backgroundColor: colors.surfaceSolid, borderWidth: 1, borderColor: colors.glassBorderStrong }, sheetContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, quantity: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surface }, input: { minWidth: 100, color: colors.textPrimary, textAlign: 'center', fontSize: 30, fontWeight: '800' } });
