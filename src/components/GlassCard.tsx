import type { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'default' | 'elevated' | 'interactive' | 'accent' | 'compact';
interface Props extends PropsWithChildren { variant?: Variant; selected?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; }

export function GlassCard({ children, variant = 'default', selected, onPress, style, accessibilityLabel }: Props) {
  const { colors, isDark } = useTheme();
  const content = <>
    {Platform.OS === 'ios' ? <BlurView intensity={variant === 'elevated' ? 32 : 20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    <LinearGradient colors={selected || variant === 'accent' ? [colors.greenGlow, colors.surfaceStrong] : [colors.surface, colors.surfaceStrong]} style={[styles.inner, variant === 'compact' && styles.compact]}>
      {children}
    </LinearGradient>
  </>;
  const baseStyle = [styles.card, variants[variant], { borderColor: selected ? colors.glassBorderStrong : colors.glassBorder, backgroundColor: colors.surface, shadowColor: colors.backgroundPrimary }, selected && { shadowColor: colors.greenPrimary, shadowOpacity: 0.18 }, style];
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
  card: { overflow: 'hidden', borderRadius: radii.lg, borderWidth: 1, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  inner: { padding: spacing.lg }, compact: { padding: spacing.md },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
const variants = StyleSheet.create({
  default: {}, elevated: {}, interactive: {}, accent: {}, compact: { borderRadius: radii.md },
});
