import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { productAssets } from '@/constants/productAssets';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { Product } from '@/types/domain';
import { getProductSourceLabel } from '@/services/productPresentation';

function ProductListRowComponent({ product, onOpen, onAdd, onFavorite }: { product: Product; onOpen: (product: Product) => void; onAdd: (product: Product) => void; onFavorite?: (product: Product) => void }) {
  const { colors } = useTheme();
  const source = product.imageUri ? { uri: product.imageUri } : productAssets[product.imageKey];
  const sourceLabel = getProductSourceLabel(product);
  const nutritionLabel = `${Math.round(product.caloriesPer100g)} килокалорий, белки ${product.proteinPer100g?.toFixed(1) ?? 'не указаны'}, жиры ${product.fatPer100g?.toFixed(1) ?? 'не указаны'}, углеводы ${product.carbsPer100g?.toFixed(1) ?? 'не указаны'} на 100 граммов`;
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [product.imageKey, product.imageUri]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}. ${nutritionLabel}. Источник: ${sourceLabel}. Открыть карточку.`} onPress={() => onOpen(product)} style={({ pressed }) => [styles.root, { backgroundColor: colors.surface, borderColor: colors.glassBorder }, pressed && styles.pressed]}>
    {source && !imageFailed ? <Image source={source} contentFit="cover" cachePolicy="memory-disk" recyclingKey={`product-${product.id}-${product.imageUri ?? product.imageKey}`} style={styles.image} transition={80} onError={() => setImageFailed(true)} /> : <View style={[styles.image, styles.placeholder, { backgroundColor: colors.greenDark }]}><AppText variant="heading" tone="green">{product.name.slice(0, 1)}</AppText></View>}
    <View style={styles.copy}><View style={styles.titleRow}><View style={styles.titleCopy}><AppText numberOfLines={2} style={styles.name}>{product.name}</AppText>{product.brand ? <AppText variant="caption" tone="secondary" numberOfLines={1}>{product.brand}</AppText> : null}</View>{onFavorite ? <Pressable hitSlop={10} accessibilityLabel={product.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'} onPress={(event) => { event.stopPropagation(); onFavorite(product); }}><AppText tone={product.isFavorite ? 'green' : 'muted'}>{product.isFavorite ? '♥' : '♡'}</AppText></Pressable> : null}</View>
      <AppText variant="caption" tone="secondary">{Math.round(product.caloriesPer100g)} ккал · Б {product.proteinPer100g == null ? '—' : product.proteinPer100g.toFixed(1)} · Ж {product.fatPer100g == null ? '—' : product.fatPer100g.toFixed(1)} · У {product.carbsPer100g == null ? '—' : product.carbsPer100g.toFixed(1)}</AppText>
      <View style={styles.meta}><AppText variant="caption" tone="muted" numberOfLines={1} style={styles.source}>Порция {Math.round(product.servingSizeG)} г · {sourceLabel}</AppText><Pressable accessibilityRole="button" accessibilityLabel={`Добавить ${product.name} в дневник`} onPress={(event) => { event.stopPropagation(); onAdd(product); }} style={[styles.add, { backgroundColor: colors.greenGlow }]}><AppText variant="caption" tone="green" style={styles.addLabel}>+</AppText></Pressable></View>
    </View>
  </Pressable>;
}

export const ProductListRow = memo(ProductListRowComponent);

const styles = StyleSheet.create({
  root: { minHeight: 102, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.lg, borderWidth: 1, padding: spacing.sm }, image: { width: 78, height: 78, borderRadius: radii.md }, placeholder: { alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', gap: spacing.sm }, titleCopy: { flex: 1 }, name: { fontWeight: '700' }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs }, source:{flex:1}, add: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, addLabel: { fontSize: 20, lineHeight: 22, fontWeight: '800' }, pressed: { opacity: 0.74 },
});
