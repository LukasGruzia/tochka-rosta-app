import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { radii, spacing } from '@/theme/tokens';
import { GlassSurface, type GlassSurfaceVariant } from './GlassSurface';

type Variant = 'default' | 'elevated' | 'interactive' | 'accent' | 'compact';
interface Props extends PropsWithChildren { variant?: Variant; selected?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; }

export function GlassCard({ children, variant = 'default', selected, onPress, style, accessibilityLabel }: Props) {
  const surfaceVariant: GlassSurfaceVariant = variant === 'accent' ? 'accent' : variant === 'elevated' ? 'raised' : variant === 'interactive' ? 'interactive' : 'base';
  return <GlassSurface
    variant={surfaceVariant}
    selected={selected}
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    style={[variant === 'compact' && styles.compactRadius, style]}
    contentStyle={variant === 'compact' ? styles.compact : styles.inner}
  >{children}</GlassSurface>;
}

const styles = StyleSheet.create({
  inner: { padding: spacing.lg },
  compact: { padding: spacing.md },
  compactRadius: { borderRadius: radii.md },
});
