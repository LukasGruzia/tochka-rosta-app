import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { TabScreen } from '@/components/TabScreen';
import { productAssets } from '@/constants/productAssets';
import { searchProducts } from '@/services/productSearch';
import { getNextMealType } from '@/services/diaryMath';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Product } from '@/types/domain';

type Filter = 'all' | 'favorites' | 'my' | 'tochka' | 'common' | 'barcode';
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' }, { value: 'favorites', label: 'Избранное' }, { value: 'my', label: 'Мои' },
  { value: 'tochka', label: 'Точка Роста' }, { value: 'common', label: 'Обычные продукты' }, { value: 'barcode', label: 'По коду' },
];

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ meal?: string }>();
  const products = useAppStore((state) => state.products);
  const addToDiary = useAppStore((state) => state.addToDiary);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const filtered = useMemo(() => searchProducts(products.filter((product) => {
    if (filter === 'favorites') return product.isFavorite;
    if (filter === 'my') return product.isUserCreated;
    if (filter === 'tochka') return product.sourceType === 'tochka_rosta';
    if (filter === 'common') return product.sourceType === 'usda';
    if (filter === 'barcode') return product.sourceType === 'open_food_facts';
    return true;
  }), query), [filter, products, query]);

  return <>
    <TabScreen title="Каталог" subtitle={`${products.length} продуктов доступны локально`} headerRight={
      <Pressable accessibilityLabel="Сканировать код" style={styles.iconButton} onPress={() => router.push('/scanner')}><AppIcon name="qr" color={colors.greenBright}/></Pressable>
    }>
      <View style={styles.search}><AppText tone="muted">⌕</AppText><TextInput value={query} onChangeText={setQuery} placeholder="Найти продукт или блюдо" placeholderTextColor={colors.textMuted} style={styles.searchInput} returnKeyType="search"/><Pressable onPress={() => setQuery('')}><AppText tone="secondary">{query ? '×' : ''}</AppText></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((item) => <FilterChip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)}/>)}</ScrollView>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => router.push('/product/new')}><AppText tone="green">＋</AppText><AppText variant="caption">Создать продукт</AppText></Pressable>
        <Pressable style={styles.action} onPress={() => router.push('/recipe/new')}><AppText tone="green">＋</AppText><AppText variant="caption">Собрать рецепт</AppText></Pressable>
      </View>
      {!filtered.length ? <GlassCard style={styles.empty}><AppText variant="heading">Ничего не найдено</AppText><AppText tone="secondary" style={styles.center}>Попробуй другое название или сбрось фильтр.</AppText></GlassCard> : filtered.map((product) => {
        const imageSource = product.imageUri ? { uri: product.imageUri } : productAssets[product.imageKey];
        return <GlassCard key={product.id} variant="compact" style={styles.card} onPress={() => router.push(`/product/${product.id}` as never)}>
          <View style={styles.cardRow}>{imageSource ? <Image source={imageSource} contentFit="cover" style={styles.image}/> : <View style={styles.placeholder}><AppText variant="heading" tone="green">{product.name.slice(0, 1)}</AppText></View>}
            <View style={styles.copy}><View style={styles.titleRow}><AppText style={styles.name} numberOfLines={2}>{product.name}</AppText><Pressable hitSlop={12} accessibilityLabel={product.isFavorite ? 'Убрать из избранного' : 'В избранное'} onPress={(event) => { event.stopPropagation(); void toggleFavorite(product.id); }}><AppText tone={product.isFavorite ? 'green' : 'muted'}>{product.isFavorite ? '♥' : '♡'}</AppText></Pressable></View>
              <AppText variant="caption" tone="secondary">{Math.round(product.caloriesPer100g)} ккал · Б {product.proteinPer100g == null ? '—' : product.proteinPer100g.toFixed(1)} · Ж {product.fatPer100g == null ? '—' : product.fatPer100g.toFixed(1)} · У {product.carbsPer100g == null ? '—' : product.carbsPer100g.toFixed(1)}</AppText>
              <View style={styles.meta}><AppText variant="caption" tone="muted">на 100 г · {product.sourceName}</AppText><Pressable style={styles.add} onPress={(event) => { event.stopPropagation(); setSelected(product); }}><AppText variant="caption" tone="green" style={styles.addLabel}>Добавить</AppText></Pressable></View>
            </View>
          </View>
        </GlassCard>;
      })}
    </TabScreen>
    <AddToDiarySheet product={selected} visible={selected !== null} initialMeal={['breakfast', 'lunch', 'snack', 'dinner'].includes(params.meal ?? '') ? params.meal as never : getNextMealType()} onClose={() => setSelected(null)} onAdd={async (mealType, servings, quantityG) => {
      if (!selected) return; await addToDiary({ product: selected, mealType, servings, quantityG }); Alert.alert('Готово', 'Продукт добавлен в дневник.');
    }}/>
  </>;
}

const styles = StyleSheet.create({
  iconButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.greenGlow, borderWidth: 1, borderColor: colors.glassBorder },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong }, searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16 }, filters: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm }, action: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surface },
  card: { padding: 0 }, cardRow: { flexDirection: 'row', gap: spacing.md }, image: { width: 78, height: 78, borderRadius: radii.md }, placeholder: { width: 78, height: 78, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenDark }, copy: { flex: 1, gap: spacing.xs }, titleRow: { flexDirection: 'row', gap: spacing.sm }, name: { flex: 1, fontWeight: '700' }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, add: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.greenGlow }, addLabel: { fontWeight: '800' }, empty: { alignItems: 'center', gap: spacing.sm }, center: { textAlign: 'center' },
});
