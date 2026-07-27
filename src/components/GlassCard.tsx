import type { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '@/theme/tokens';

type Variant = 'default' | 'elevated' | 'interactive' | 'accent' | 'compact';
interface Props extends PropsWithChildren { variant?: Variant; selected?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; }

export function GlassCard({ children, variant = 'default', selected, onPress, style, accessibilityLabel }: Props) {
  const content = <>
    {Platform.OS === 'ios' ? <BlurView intensity={variant === 'elevated' ? 32 : 20} tint="dark" style={StyleSheet.absoluteFill} /> : null}
    <LinearGradient colors={selected || variant === 'accent' ? ['rgba(56,217,120,0.18)', 'rgba(16,34,23,0.74)'] : ['rgba(255,255,255,0.045)', 'rgba(16,34,23,0.48)']} style={[styles.inner, variant === 'compact' && styles.compact]}>
      {children}
    </LinearGradient>
  </>;
  const baseStyle = [styles.card, variants[variant], selected && styles.selected, style];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View accessibilityLabel={accessibilityLabel} style={baseStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surface, shadowColor: colors.backgroundPrimary, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  inner: { padding: spacing.lg }, compact: { padding: spacing.md },
  selected: { borderColor: colors.glassBorderStrong, shadowColor: colors.greenPrimary, shadowOpacity: 0.18 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
const variants = StyleSheet.create({
  default: {}, elevated: { backgroundColor: colors.surfaceStrong }, interactive: {}, accent: { borderColor: colors.glassBorderStrong }, compact: { borderRadius: radii.md },
});
