import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { AppPressable } from './AppPressable';

type Variant = 'default' | 'elevated' | 'interactive' | 'accent' | 'compact';
interface Props extends PropsWithChildren { variant?: Variant; selected?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; }

export function GlassCard({ children, variant = 'default', selected, onPress, style, accessibilityLabel }: Props) {
  const { colors, isDark } = useTheme();
  const { flags } = useFeatureFlags();
  const glassLevel = variant === 'accent' ? glass.accent : variant === 'elevated' || variant === 'interactive' ? glass.raised : glass.base;
  const content = <>
    {Platform.OS === 'ios' && flags.enableAdvancedGlassBlur ? <BlurView intensity={glassLevel.blur} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    <LinearGradient colors={selected || variant === 'accent' ? [colors.greenGlow, colors.surfaceStrong] : [colors.surface, colors.surfaceStrong]} style={[styles.inner, variant === 'compact' && styles.compact]}>
      {children}
    </LinearGradient>
  </>;
  const baseStyle = [styles.card, variants[variant], { borderColor: selected ? colors.glassBorderStrong : colors.glassBorder, backgroundColor: colors.surface, shadowColor: colors.backgroundPrimary }, selected && { shadowColor: colors.greenPrimary, shadowOpacity: 0.18 }, style];
  if (onPress) {
    return (
      <AppPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} actionLabel={accessibilityLabel ?? 'glass_card'} onPress={onPress}
        style={baseStyle} pressedStyle={styles.pressed}>
        {content}
      </AppPressable>
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
