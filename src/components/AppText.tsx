import type { ComponentProps } from 'react';
import { Text } from 'react-native';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'screenTitle' | 'sectionTitle' | 'cardTitle' | 'title' | 'heading' | 'body' | 'caption' | 'tabLabel';
interface Props extends ComponentProps<typeof Text> { variant?: Variant; tone?: 'primary' | 'secondary' | 'muted' | 'green' | 'warning'; }

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  const { colors } = useTheme();
  const toneColor = { primary: colors.textPrimary, secondary: colors.textSecondary, muted: colors.textMuted, green: colors.greenBright, warning: colors.warning }[tone];
  return <Text maxFontSizeMultiplier={1.35} style={[typography[variant], { color: toneColor }, style]} {...props} />;
}
