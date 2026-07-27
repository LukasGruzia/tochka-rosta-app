import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from './AppBackground';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme/tokens';

interface Props extends PropsWithChildren { eyebrow?: string; title: string; description?: string; footer?: ReactNode; progress?: number; keyboard?: boolean; }
export function OnboardingShell({ eyebrow, title, description, footer, progress, keyboard, children }: Props) {
  const content = (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {typeof progress === 'number' ? <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} /></View> : null}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {eyebrow ? <AppText variant="caption" tone="green" style={styles.eyebrow}>{eyebrow}</AppText> : null}
          <AppText variant="title">{title}</AppText>
          {description ? <AppText tone="secondary">{description}</AppText> : null}
        </View>
        <View style={styles.content}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
  return <AppBackground>{keyboard ? <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{content}</KeyboardAvoidingView> : content}</AppBackground>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1 }, progressTrack: { height: 3, marginHorizontal: spacing.lg, backgroundColor: colors.surfaceStrong, borderRadius: 2 },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.greenPrimary }, scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  header: { gap: spacing.sm, marginBottom: spacing.xl }, eyebrow: { letterSpacing: 1.6, textTransform: 'uppercase' }, content: { flex: 1, gap: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: 'rgba(6,16,9,0.88)' },
});
