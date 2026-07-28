import { StyleSheet, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { MacroProgress } from './MacroProgress';
import { ProgressRing } from './ProgressRing';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export function NutritionHeroCard({ compact, consumed, target, remaining, progress, protein, proteinTarget, fat, fatTarget, carbs, carbsTarget, onAdd, onDetails }: {
  compact: boolean; consumed: number; target: number; remaining: number; progress: number;
  protein: number; proteinTarget: number; fat: number; fatTarget: number; carbs: number; carbsTarget: number;
  onAdd: () => void; onDetails: () => void;
}) {
  const { colors } = useTheme();
  const ringSize = compact ? 128 : 142;
  return <GlassSurface variant="accent" style={styles.shell} contentStyle={styles.content}>
    <AppPressable accessibilityRole="button" accessibilityLabel="Добавить приём пищи" actionLabel="nutrition_quick_add" onPress={onAdd} haptic="selection" style={styles.addArea} pressedStyle={styles.pressed}>
    <View style={styles.primaryRow}>
      <ProgressRing progress={progress} size={ringSize} strokeWidth={8} value={consumed.toLocaleString('ru-RU')} label="ккал съедено" />
      <View style={styles.summary}>
        <AppText variant="caption" tone="green">БАЛАНС ДНЯ</AppText>
        <AppText variant="heading" tone={remaining < 0 ? 'warning' : 'primary'}>{remaining >= 0 ? `${remaining.toLocaleString('ru-RU')} ккал` : `${Math.abs(remaining).toLocaleString('ru-RU')} ккал`}</AppText>
        <AppText tone="secondary">{remaining >= 0 ? 'осталось до цели' : 'сверх дневной цели'}</AppText>
        <View style={styles.goalRow}><AppText variant="caption" tone="muted">Цель · {target.toLocaleString('ru-RU')}</AppText><AppIcon name="add" size={25} color={colors.greenBright} /></View>
      </View>
    </View>
    <View style={[styles.macros, { backgroundColor: colors.blackScrim }]}>
      <MacroProgress compact label="Белки" value={protein} target={proteinTarget} />
      <MacroProgress compact label="Жиры" value={fat} target={fatTarget} color={colors.gold} />
      <MacroProgress compact label="Углеводы" value={carbs} target={carbsTarget} color={colors.carbs} />
    </View>
    </AppPressable>
    <AppPressable accessibilityRole="button" accessibilityLabel="Подробнее о дневной энергии" actionLabel="nutrition_details" onPress={onDetails} style={styles.details}>
      <AppText variant="caption" tone="secondary">Подробнее о расчёте</AppText><AppIcon name="arrow" size={16} color={colors.textMuted} />
    </AppPressable>
  </GlassSurface>;
}

const styles = StyleSheet.create({
  shell: { minHeight: 276, borderRadius: radii.hero },
  content: { padding: spacing.lg, gap: spacing.sm },
  addArea: { gap: spacing.md },
  pressed: { opacity: 0.9 },
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summary: { flex: 1, minWidth: 0, gap: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  macros: { flexDirection: 'row', gap: spacing.sm, borderRadius: radii.md, padding: spacing.sm },
  details: { minHeight: 30, alignSelf: 'flex-start' },
});
