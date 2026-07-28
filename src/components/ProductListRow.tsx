import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { productAssets } from '@/constants/productAssets';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { Product } from '@/types/domain';

export function ProductListRow({ product, onOpen, onAdd, onFavorite }: { product: Product; onOpen: () => void; onAdd: () => void; onFavorite?: () => void }) {
  const { colors } = useTheme();
  const source = product.imageUri ? { uri: product.imageUri } : productAssets[product.imageKey];
  return <Pressable accessibilityRole="button" accessibilityLabel={`Открыть ${product.name}`} onPress={onOpen} style={({ pressed }) => [styles.root, { backgroundColor: colors.surface, borderColor: colors.glassBorder }, pressed && styles.pressed]}>
    {source ? <Image source={source} contentFit="cover" style={styles.image} transition={120} /> : <View style={[styles.image, styles.placeholder, { backgroundColor: colors.greenDark }]}><AppText variant="heading" tone="green">{product.name.slice(0, 1)}</AppText></View>}
    <View style={styles.copy}><View style={styles.titleRow}><AppText numberOfLines={2} style={styles.name}>{product.name}</AppText>{onFavorite ? <Pressable hitSlop={10} accessibilityLabel={product.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'} onPress={(event) => { event.stopPropagation(); onFavorite(); }}><AppText tone={product.isFavorite ? 'green' : 'muted'}>{product.isFavorite ? '♥' : '♡'}</AppText></Pressable> : null}</View>
      <AppText variant="caption" tone="secondary">{Math.round(product.caloriesPer100g)} ккал · Б {product.proteinPer100g == null ? '—' : product.proteinPer100g.toFixed(1)} · Ж {product.fatPer100g == null ? '—' : product.fatPer100g.toFixed(1)} · У {product.carbsPer100g == null ? '—' : product.carbsPer100g.toFixed(1)}</AppText>
      <View style={styles.meta}><AppText variant="caption" tone="muted" numberOfLines={1}>на 100 г · {product.sourceName}</AppText><Pressable accessibilityRole="button" accessibilityLabel={`Добавить ${product.name}`} onPress={(event) => { event.stopPropagation(); onAdd(); }} style={[styles.add, { backgroundColor: colors.greenGlow }]}><AppText variant="caption" tone="green" style={styles.addLabel}>+</AppText></Pressable></View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { minHeight: 102, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.lg, borderWidth: 1, padding: spacing.sm }, image: { width: 78, height: 78, borderRadius: radii.md }, placeholder: { alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', gap: spacing.sm }, name: { flex: 1, fontWeight: '700' }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs }, add: { width: 34, height: 30, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, addLabel: { fontSize: 20, lineHeight: 22, fontWeight: '800' }, pressed: { opacity: 0.74 },
});
