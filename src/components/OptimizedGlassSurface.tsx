import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import type { AppHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { glass, radii, shadows } from '@/theme/tokens';
import { AppPressable } from './AppPressable';

export type GlassSurfaceVariant = 'base' | 'raised' | 'interactive' | 'accent' | 'overlay' | 'navigation';

interface Props extends PropsWithChildren {
  variant?: GlassSurfaceVariant;
  selected?: boolean;
  nativeBlur?: boolean;
  onPress?: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: AppHaptic;
}

export function OptimizedGlassSurface({ children, variant = 'base', selected = false, nativeBlur = false, onPress, style, contentStyle, accessibilityLabel, haptic = 'light' }: Props) {
  const { colors, isDark } = useTheme();
  const { flags, resolvedPerformanceMode } = useFeatureFlags();
  const level = glass[variant];
  const isAccent = selected || variant === 'accent';
  const surface = variant === 'base'
    ? colors.surfaceBase
    : variant === 'interactive'
      ? colors.surfaceInteractive
      : variant === 'accent'
        ? colors.surfaceAccent
        : variant === 'overlay'
          ? colors.surfaceOverlay
          : variant === 'navigation'
            ? colors.surfaceNavigation
            : colors.surfaceRaised;
  const gradient = isAccent ? [colors.surfaceAccent, colors.surfaceRaised] as const : [colors.specular, surface] as const;
  const allowNativeBlur = Platform.OS === 'ios'
    && flags.enableAdvancedGlassBlur
    && resolvedPerformanceMode !== 'reduced'
    && resolvedPerformanceMode !== 'safe'
    && (nativeBlur || variant === 'navigation' || variant === 'overlay');
  const blurIntensity = resolvedPerformanceMode === 'full' ? level.blur : Math.min(level.blur, 18);
  const shellStyle = [
    styles.shell,
    variant === 'navigation' ? styles.navigation : styles.card,
    shadows[variant === 'navigation' || variant === 'overlay' ? 'floating' : variant === 'raised' || variant === 'accent' ? 'raised' : 'card'],
    {
      backgroundColor: surface,
      borderColor: isAccent ? colors.glassBorderStrong : colors.glassBorder,
      borderWidth: level.borderWidth,
      shadowColor: isAccent ? colors.greenPrimary : colors.backgroundPrimary,
      shadowOpacity: level.shadowOpacity,
      shadowRadius: level.shadowRadius,
    },
    style,
  ];
  const content = <>
    {allowNativeBlur ? <BlurView intensity={blurIntensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    <LinearGradient colors={gradient} start={{ x: 0.08, y: 0 }} end={{ x: 0.92, y: 1 }} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={[styles.specular, { backgroundColor: colors.specular }]} />
    <View style={[styles.content, contentStyle]}>{children}</View>
  </>;

  if (onPress) {
    return <AppPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} actionLabel={accessibilityLabel ?? `glass_${variant}`} haptic={haptic} onPress={onPress} style={shellStyle} pressedStyle={styles.pressed}>{content}</AppPressable>;
  }
  return <View accessibilityLabel={accessibilityLabel} style={shellStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  shell: { overflow: 'hidden' },
  card: { borderRadius: radii.lg },
  navigation: { borderRadius: radii.tabBar },
  content: { flex: 1 },
  specular: { position: 'absolute', left: 18, right: 18, top: 0, height: StyleSheet.hairlineWidth, zIndex: 2 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
