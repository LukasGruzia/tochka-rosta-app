import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { activityLabels, dietLabels, goalLabels, restrictionLabels } from '@/constants/options';
import { roundNutrition } from '@/services/nutritionCalculator';
import { useAppStore } from '@/store/appStore';
import { colors, spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const { profile, target, recalculate, reset } = useAppStore();
  if (!profile || !target) return <TabScreen title="Профиль"><AppText tone="secondary">Профиль ещё не создан.</AppText></TabScreen>;
  const rounded = roundNutrition(target);
  const doRecalculate = async () => { try { await recalculate(); Alert.alert('Готово', 'Дневная норма пересчитана и сохранена.'); } catch { Alert.alert('Ошибка', 'Не удалось пересчитать норму.'); } };
  const confirmReset = () => Alert.alert('Сбросить приложение?', 'Все локальные данные, профиль и прогресс будут удалены с этого устройства.', [
    { text: 'Отмена', style: 'cancel' }, { text: 'Сбросить', style: 'destructive', onPress: () => { void reset().then(() => router.replace('/(onboarding)/welcome')); } },
  ]);
  return <TabScreen title={profile.name} subtitle="Твой профиль хранится только на этом устройстве.">
    <GlassCard variant="accent" style={styles.target}><AppText variant="caption" tone="green">ДНЕВНОЙ ОРИЕНТИР</AppText><AppText variant="display">{rounded.calories.toLocaleString('ru-RU')}</AppText><AppText tone="secondary">ккал в день</AppText></GlassCard>
    <GlassCard variant="default">
      <Row label="Возраст" value={`${profile.age} лет`}/><Row label="Рост" value={`${profile.heightCm} см`}/><Row label="Вес" value={`${profile.weightKg} кг`}/>
      <Row label="Активность" value={activityLabels[profile.activityLevel]}/><Row label="Цель" value={goalLabels[profile.goal]}/><Row label="Питание" value={dietLabels[profile.dietPreference]}/>
      <Row label="Ограничения" value={profile.restrictions.length ? profile.restrictions.map((item) => restrictionLabels[item]).join(', ') : 'Нет'}/>
    </GlassCard>
    <GlassCard variant="compact"><AppText variant="heading">КБЖУ</AppText><View style={styles.macro}><AppText tone="secondary">Белки {rounded.proteinG} г</AppText><AppText tone="secondary">Жиры {rounded.fatG} г</AppText><AppText tone="secondary">Углеводы {rounded.carbsG} г</AppText></View></GlassCard>
    <View style={styles.actions}><PrimaryButton label="Изменить данные" onPress={() => router.push('/edit-profile')} /><PrimaryButton label="Пересчитать норму" secondary onPress={doRecalculate} /><PrimaryButton label="Сбросить приложение" secondary onPress={confirmReset} /></View>
  </TabScreen>;
}
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><AppText variant="caption" tone="secondary">{label}</AppText><AppText style={styles.value}>{value}</AppText></View>; }
const styles = StyleSheet.create({ target: { alignItems: 'center', gap: 3 }, row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.glassBorder, gap: 4 }, value: { fontWeight: '700' }, macro: { gap: spacing.xs, marginTop: spacing.sm }, actions: { gap: spacing.sm } });
