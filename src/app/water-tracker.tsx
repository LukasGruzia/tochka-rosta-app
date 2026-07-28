import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { FormField } from '@/components/FormField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { getWaterProgress } from '@/services/waterMath';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export default function WaterTrackerScreen() {
  const water = useAppStore((state) => state.water);
  const addWater = useAppStore((state) => state.addWater);
  const removeWater = useAppStore((state) => state.removeWater);
  const setWaterGoal = useAppStore((state) => state.setWaterGoal);
  const { colors } = useTheme();
  const [amount, setAmount] = useState('250'); const [goal, setGoal] = useState(String(water?.goalMl ?? 2000));
  const total = water?.totalMl ?? 0; const target = water?.goalMl ?? 2000; const progress = getWaterProgress(total, target);
  const add = async () => { try { await addWater(Number(amount.replace(',', '.'))); } catch (error) { Alert.alert('Проверь объём', error instanceof Error ? error.message : 'Не удалось добавить воду.'); } };
  const saveGoal = async () => { await setWaterGoal(Number(goal.replace(',', '.'))); Alert.alert('Готово', 'Цель по воде сохранена.'); };
  return <TabScreen title="Вода" subtitle="Дневная цель и записи" headerRight={<Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}><AppText>×</AppText></Pressable>}>
    <GlassCard variant="accent" style={styles.hero}><AppText variant="display">{total.toLocaleString('ru-RU')}</AppText><AppText tone="secondary">из {target.toLocaleString('ru-RU')} мл сегодня</AppText><View style={[styles.track, { backgroundColor: colors.greenDark }]}><View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.carbs }]} /></View><AppText variant="caption" tone={progress >= 1 ? 'green' : 'muted'}>{progress >= 1 ? 'Дневная цель достигнута' : `Осталось ${Math.max(0, target - total).toLocaleString('ru-RU')} мл`}</AppText></GlassCard>
    <GlassCard><AppText variant="heading">Добавить воду</AppText><View style={styles.quick}>{[200, 250, 330, 500].map((value) => <Pressable key={value} onPress={() => { setAmount(String(value)); void addWater(value); }} style={[styles.quickButton, { backgroundColor: colors.greenGlow }]}><AppText tone="green">+{value}</AppText></Pressable>)}</View><FormField label="Другой объём" value={amount} onChangeText={setAmount} keyboardType="number-pad" suffix="мл" /><PrimaryButton label="Добавить" onPress={add} /></GlassCard>
    <GlassCard><AppText variant="heading">Дневная цель</AppText><FormField label="Цель" value={goal} onChangeText={setGoal} keyboardType="number-pad" suffix="мл" /><PrimaryButton label="Сохранить цель" secondary onPress={saveGoal} /></GlassCard>
    <GlassCard variant="compact"><AppText variant="heading">Сегодня</AppText>{water?.entries.length ? [...water.entries].reverse().map((entry) => <Pressable key={entry.id} onLongPress={() => Alert.alert('Удалить запись?', `${entry.amountMl} мл`, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => { void removeWater(entry.id); } }])} style={[styles.entry, { borderBottomColor: colors.glassBorder }]}><AppText>{entry.amountMl} мл</AppText><AppText variant="caption" tone="muted">{new Date(entry.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</AppText></Pressable>) : <AppText tone="muted">Записей пока нет</AppText>}</GlassCard>
  </TabScreen>;
}

const styles = StyleSheet.create({
  close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, hero: { alignItems: 'center', gap: spacing.sm }, track: { width: '100%', height: 10, borderRadius: radii.pill, overflow: 'hidden' }, fill: { height: '100%', borderRadius: radii.pill },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md }, quickButton: { minWidth: 68, minHeight: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, entry: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
});
