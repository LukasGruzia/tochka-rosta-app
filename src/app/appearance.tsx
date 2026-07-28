import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { TabScreen } from '@/components/TabScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { ThemeMode } from '@/types/domain';

const choices: { mode: ThemeMode; title: string; description: string; symbol: string }[] = [
  { mode: 'system', title: 'Как в системе', description: 'Следует настройке iPhone', symbol: '◐' },
  { mode: 'dark', title: 'Тёмная', description: 'Глубокий зелёный Liquid Glass', symbol: '●' },
  { mode: 'light', title: 'Светлая', description: 'Светлое стекло и высокий контраст', symbol: '○' },
];

export default function AppearanceScreen() {
  const { mode, setMode, colors } = useTheme();
  return <TabScreen title="Оформление" subtitle="Выбор сохраняется только на этом устройстве" headerRight={<Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}><AppText>×</AppText></Pressable>}>
    {choices.map((item) => <GlassCard key={item.mode} variant="interactive" selected={mode === item.mode} onPress={() => { void setMode(item.mode); }} accessibilityLabel={item.title}>
      <View style={styles.row}><View style={[styles.symbol, { backgroundColor: colors.greenGlow }]}><AppText variant="heading" tone="green">{item.symbol}</AppText></View><View style={styles.copy}><AppText variant="heading">{item.title}</AppText><AppText tone="secondary">{item.description}</AppText></View><AppText tone={mode === item.mode ? 'green' : 'muted'}>{mode === item.mode ? '✓' : ''}</AppText></View>
    </GlassCard>)}
    <GlassCard variant="compact"><AppText variant="heading">Liquid Glass остаётся</AppText><AppText tone="secondary">На iOS используется размытие. На устройствах без нативного эффекта включается аккуратный полупрозрачный fallback.</AppText></GlassCard>
  </TabScreen>;
}

const styles = StyleSheet.create({
  close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  symbol: { width: 46, height: 46, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 3 },
});
