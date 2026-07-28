import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { safelyRunHaptic } from '@/services/haptics';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { getWaterProgress } from '@/services/waterMath';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export function WaterCard({ onOpen }: { onOpen: () => void }) {
  const water = useAppStore((state) => state.water);
  const addWater = useAppStore((state) => state.addWater);
  const { colors } = useTheme();
  const [adding, setAdding] = useState<number | null>(null);
  const total = water?.totalMl ?? 0; const goal = water?.goalMl ?? 2000; const progress = getWaterProgress(total, goal);
  const add = async (amount: number) => { if (adding !== null) return; try { setAdding(amount); void safelyRunHaptic('light'); await addWater(amount); } catch (error) { Alert.alert('Не удалось добавить воду', error instanceof Error ? error.message : 'Попробуй ещё раз.'); } finally { setAdding(null); } };
  return <GlassCard variant="compact">
    <Pressable accessibilityRole="button" accessibilityLabel="Открыть трекер воды" onPress={onOpen} style={styles.header}><View style={[styles.icon, { backgroundColor: `${colors.carbs}22` }]}><AppText style={{ color: colors.carbs }}>◒</AppText></View><View style={styles.copy}><AppText variant="heading">Вода</AppText><AppText variant="caption" tone="secondary">{total.toLocaleString('ru-RU')} из {goal.toLocaleString('ru-RU')} мл</AppText></View><AppText tone="muted">›</AppText></Pressable>
    <View style={[styles.track, { backgroundColor: colors.greenDark }]}><View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.carbs }]} /></View>
    <View style={styles.actions}>{[200, 250, 500].map((amount) => <Pressable key={amount} accessibilityRole="button" accessibilityLabel={`Добавить ${amount} миллилитров воды`} disabled={adding !== null} onPress={() => { void add(amount); }} style={({ pressed }) => [styles.amount, { backgroundColor: colors.surface, borderColor: colors.glassBorder }, pressed && styles.pressed, adding !== null && styles.disabled]}><AppText variant="caption" style={styles.bold}>{adding === amount ? '…' : `+${amount}`}</AppText></Pressable>)}</View>
  </GlassCard>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, icon: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  track: { height: 8, borderRadius: radii.pill, overflow: 'hidden', marginTop: spacing.md }, fill: { height: '100%', borderRadius: radii.pill }, actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  amount: { flex: 1, minHeight: 38, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, bold: { fontWeight: '700' }, pressed: { opacity: 0.65 }, disabled: { opacity: 0.5 },
});
