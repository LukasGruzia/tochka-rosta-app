import type { ComponentProps } from 'react';
import { Text, type TextStyle } from 'react-native';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'largeTitle' | 'screenTitle' | 'sectionTitle' | 'cardTitle' | 'title' | 'heading' | 'body' | 'callout' | 'caption' | 'button' | 'tabLabel' | 'metric';
interface Props extends ComponentProps<typeof Text> { variant?: Variant; tone?: 'primary' | 'secondary' | 'muted' | 'green' | 'warning'; }

export function AppText({ variant = 'body', tone = 'primary', style, maxFontSizeMultiplier, ...props }: Props) {
  const { colors } = useTheme();
  const toneColor = { primary: colors.textPrimary, secondary: colors.textSecondary, muted: colors.textMuted, green: colors.greenBright, warning: colors.warning }[tone];
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier ?? (variant === 'metric' ? 1.5 : 2)} style={[typography[variant] as TextStyle, { color: toneColor }, style]} {...props} />;
}
