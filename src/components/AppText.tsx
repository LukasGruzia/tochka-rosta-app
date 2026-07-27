import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption';
interface Props extends ComponentProps<typeof Text> { variant?: Variant; tone?: 'primary' | 'secondary' | 'muted' | 'green' | 'warning'; }

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  return <Text maxFontSizeMultiplier={1.35} style={[styles.base, typography[variant], tones[tone], style]} {...props} />;
}

const styles = StyleSheet.create({ base: { color: colors.textPrimary } });
const tones = StyleSheet.create({
  primary: { color: colors.textPrimary }, secondary: { color: colors.textSecondary }, muted: { color: colors.textMuted },
  green: { color: colors.greenBright }, warning: { color: colors.warning },
});
