import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from './AppBackground';
import { AppText } from './AppText';
import { spacing } from '@/theme/tokens';

interface Props extends PropsWithChildren { title?: string; subtitle?: string; headerRight?: ReactNode; }
export function TabScreen({ title, subtitle, headerRight, children }: Props) {
  return <AppBackground><SafeAreaView style={styles.safe} edges={['top']}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    {title ? <View style={styles.header}><View style={styles.copy}><AppText variant="title">{title}</AppText>{subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}</View>{headerRight}</View> : null}
    {children}
  </ScrollView></SafeAreaView></AppBackground>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 130, gap: spacing.md }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm }, copy: { flex: 1, gap: 5 } });
