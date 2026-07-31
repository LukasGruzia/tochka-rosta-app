import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

import { AppIcon, type IconName } from './AppIcon';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';

type ScreenStateProps = {
  title: string;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void | Promise<void>;
  tone?: 'default' | 'accent' | 'error' | 'success';
};

export function ScreenState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tone = 'default',
}: ScreenStateProps) {
  const { colors } = useTheme();
  const accent = tone === 'error' ? colors.warning : colors.greenBright;
  return (
    <GlassCard variant={tone === 'accent' || tone === 'success' ? 'accent' : 'default'} style={styles.state}>
      {icon ? <View style={[styles.stateIcon, { backgroundColor: colors.greenGlow }]}><AppIcon name={icon} size={28} color={accent} /></View> : null}
      <AppText variant="heading" style={styles.center}>{title}</AppText>
      <AppText tone="secondary" style={styles.center}>{message}</AppText>
      {actionLabel && onAction ? <View style={styles.action}><PrimaryButton label={actionLabel} onPress={onAction} /></View> : null}
      {secondaryActionLabel && onSecondaryAction ? <View style={styles.action}><PrimaryButton label={secondaryActionLabel} secondary onPress={onSecondaryAction} /></View> : null}
    </GlassCard>
  );
}

function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.block, { backgroundColor: colors.surfaceInteractive }, style]} />;
}

export function ProductCardSkeleton({ count = 4 }: { count?: number }) {
  return <View accessibilityLabel="Загружаем продукты" style={styles.list}>{Array.from({ length: count }, (_, index) => <View key={index} style={styles.product}><SkeletonBlock style={styles.productImage} /><View style={styles.grow}><SkeletonBlock style={styles.lineWide} /><SkeletonBlock style={styles.lineMedium} /></View><SkeletonBlock style={styles.circle} /></View>)}</View>;
}

export function DiaryMealSkeleton() {
  return <View accessibilityLabel="Загружаем дневник" style={styles.list}><SkeletonBlock style={styles.hero} />{Array.from({ length: 3 }, (_, index) => <View key={index} style={styles.meal}><SkeletonBlock style={styles.lineMedium} /><SkeletonBlock style={styles.entry} /><SkeletonBlock style={styles.entry} /></View>)}</View>;
}

export function StatsSkeleton() {
  return <View accessibilityLabel="Загружаем статистику" style={styles.list}><View style={styles.metrics}><SkeletonBlock style={styles.metric} /><SkeletonBlock style={styles.metric} /></View><SkeletonBlock style={styles.chart} /><SkeletonBlock style={styles.meal} /></View>;
}

export function ProfileSkeleton() {
  return <View accessibilityLabel="Загружаем профиль" style={styles.list}><View style={styles.profile}><SkeletonBlock style={styles.avatar} /><SkeletonBlock style={styles.lineMedium} /><SkeletonBlock style={styles.lineShort} /></View><View style={styles.metrics}><SkeletonBlock style={styles.metric} /><SkeletonBlock style={styles.metric} /><SkeletonBlock style={styles.metric} /></View><SkeletonBlock style={styles.meal} /><SkeletonBlock style={styles.meal} /></View>;
}

export function PlannerSkeleton() {
  return <View accessibilityLabel="Загружаем план" style={styles.list}><SkeletonBlock style={styles.hero} />{Array.from({ length: 3 }, (_, index) => <SkeletonBlock key={index} style={styles.meal} />)}</View>;
}

export function RhythmSuggestionSkeleton() {
  return <View accessibilityLabel="Ритм подбирает варианты" style={styles.list}>{Array.from({ length: 2 }, (_, index) => <View key={index} style={styles.suggestion}><SkeletonBlock style={styles.lineShort} /><SkeletonBlock style={styles.lineWide} /><SkeletonBlock style={styles.lineMedium} /><SkeletonBlock style={styles.button} /></View>)}</View>;
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  stateIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  action: { width: '100%', marginTop: spacing.xs },
  list: { gap: spacing.md },
  block: { minHeight: 16, borderRadius: radii.sm, opacity: 0.76 },
  product: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productImage: { width: 64, height: 64, borderRadius: radii.md },
  grow: { flex: 1, gap: spacing.sm },
  lineWide: { width: '88%' },
  lineMedium: { width: '62%' },
  lineShort: { width: '36%' },
  circle: { width: 44, height: 44, borderRadius: radii.pill },
  hero: { height: 196, borderRadius: radii.lg },
  meal: { minHeight: 116, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  entry: { height: 28, width: '100%' },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, height: 96, borderRadius: radii.lg },
  chart: { height: 210, borderRadius: radii.lg },
  profile: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  avatar: { width: 116, height: 116, borderRadius: 58 },
  suggestion: { minHeight: 190, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  button: { height: 48, width: '100%', borderRadius: radii.pill },
});
