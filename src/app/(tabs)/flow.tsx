import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { TabScreen } from '@/components/TabScreen';
import { colors, spacing } from '@/theme/tokens';

export default function FlowScreen() {
  return <TabScreen title="Поток" subtitle="Регулярность превращается в привычку.">
    <GlassCard variant="accent" style={styles.hero}><AppIcon name="flow" size={78} color={colors.greenBright}/><AppText variant="display">0 дней</AppText><AppText tone="secondary" style={styles.center}>Закрой первый день, чтобы начать серию.</AppText></GlassCard>
    <GlassCard variant="default"><AppText variant="heading">Точки пути</AppText><View style={styles.road}>{[3, 7, 14, 30].map((day) => <View key={day} style={styles.point}><AppText variant="caption" tone="muted">{day}</AppText><AppText variant="caption" tone="muted">дней</AppText></View>)}</View></GlassCard>
    <GlassCard variant="compact"><AppText variant="heading">Следующий этап</AppText><AppText tone="secondary">Закрытие дня, серии, награды и история прогресса уже подготовлены схемой SQLite.</AppText></GlassCard>
  </TabScreen>;
}
const styles = StyleSheet.create({ hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }, center: { textAlign: 'center' }, road: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }, point: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder } });
