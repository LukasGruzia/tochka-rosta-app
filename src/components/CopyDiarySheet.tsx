import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { FilterChip } from './FilterChip';
import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { mealLabels } from '@/constants/options';
import { copyDiaryEntries, undoDiaryCopy } from '@/database/repositories/diaryRepository';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { DiarySummary, MealType, NutritionResult } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';

type Scope = MealType | 'all';
const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
function tomorrow(date: string) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + 1); return getLocalDateKey(value); }

export function CopyDiarySheet({ visible, sourceDate, diary, target, initialMeal = 'all', onClose, onCopied }: { visible: boolean; sourceDate: string; diary: DiarySummary | null; target: NutritionResult; initialMeal?: Scope; onClose: () => void; onCopied: () => Promise<void> }) {
  const { colors } = useTheme(); const [scope, setScope] = useState<Scope>(initialMeal); const [targetDate, setTargetDate] = useState(tomorrow(sourceDate)); const [busy, setBusy] = useState(false);
  useEffect(() => { if (visible) { setScope(initialMeal); setTargetDate(tomorrow(sourceDate)); setBusy(false); } }, [initialMeal, sourceDate, visible]);
  const entries = useMemo(() => diary?.entries.filter((entry) => scope === 'all' || entry.mealType === scope) ?? [], [diary?.entries, scope]);
  const calories = Math.round(entries.reduce((sum, entry) => sum + entry.calories, 0));
  const copy = async () => { if (busy) return; try { setBusy(true); const ids = await copyDiaryEntries(sourceDate, targetDate, scope === 'all' ? null : scope, target); await onCopied(); onClose(); Alert.alert('Скопировано', `${entries.length} позиций · ${calories} ккал · ${targetDate}`, [{ text: 'Отменить копирование', onPress: () => { void undoDiaryCopy(ids).then(onCopied); } }, { text: 'Готово' }]); } catch (error) { Alert.alert('Не удалось скопировать', error instanceof Error ? error.message : 'Проверь дату.'); } finally { setBusy(false); } };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={[styles.scrim, { backgroundColor: colors.blackScrim }]}><View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.glassBorder }]}><View style={styles.head}><AppText variant="heading">Копировать питание</AppText><Pressable onPress={onClose}><AppText>×</AppText></Pressable></View><AppText tone="secondary">Из {sourceDate} в выбранную дату</AppText><View style={styles.chips}><FilterChip label="Весь день" selected={scope === 'all'} onPress={() => setScope('all')} />{meals.map((meal) => <FilterChip key={meal} label={mealLabels[meal]} selected={scope === meal} onPress={() => setScope(meal)} />)}</View><FormField label="Дата назначения" value={targetDate} onChangeText={setTargetDate} placeholder="ГГГГ-ММ-ДД" /><View style={[styles.preview, { backgroundColor: colors.surface }]}><AppText variant="heading">Предпросмотр</AppText><AppText tone="secondary">{entries.length} позиций · {calories} ккал</AppText>{entries.slice(0, 4).map((entry) => <AppText key={entry.id} variant="caption" tone="muted">• {entry.productName} · {Math.round(entry.quantityG)} г</AppText>)}</View><PrimaryButton label={busy ? 'Копируем…' : 'Скопировать'} disabled={busy || !entries.length} onPress={copy} /><PrimaryButton label="Отмена" secondary onPress={onClose} /></View></View></Modal>;
}

const styles = StyleSheet.create({ scrim: { flex: 1, justifyContent: 'flex-end' }, sheet: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, preview: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.md } });
