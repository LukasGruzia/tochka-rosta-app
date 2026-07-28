import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { ProductListRow } from '@/components/ProductListRow';
import { clearSearchHistory, loadFrequentProducts, loadRecentProducts, loadSearchHistory, recordSearch } from '@/database/repositories/searchRepository';
import { getNextMealType } from '@/services/diaryMath';
import { groupProductsBySource, searchProducts } from '@/services/productSearch';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { MealType, Product, SearchHistoryItem } from '@/types/domain';

interface Section { title: string; data: Product[]; }
const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function FoodSearchScreen() {
  const params = useLocalSearchParams<{ meal?: string; date?: string;mode?:'search'|'recent'|'favorites' }>();
  const products = useAppStore((state) => state.products);
  const diaryDate = useAppStore((state) => state.diaryDate);
  const addToDiary = useAppStore((state) => state.addToDiary);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(''); const [debounced, setDebounced] = useState(''); const [category, setCategory] = useState('Все'); const [selected, setSelected] = useState<Product | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]); const [recent, setRecent] = useState<Product[]>([]); const [frequent, setFrequent] = useState<Product[]>([]);
  const date = params.date ?? diaryDate; const initialMeal = mealTypes.includes(params.meal as MealType) ? params.meal as MealType : getNextMealType();

  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 220); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { void Promise.all([loadSearchHistory(), loadRecentProducts(), loadFrequentProducts()]).then(([h, r, f]) => { setHistory(h); setRecent(r); setFrequent(f); }); }, []);
  useEffect(() => { if (debounced.trim().length < 2) return; const timer = setTimeout(() => { void recordSearch(debounced).then(() => loadSearchHistory().then(setHistory)); }, 700); return () => clearTimeout(timer); }, [debounced]);

  const categories = useMemo(() => ['Все', ...Array.from(new Set(products.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'ru')).slice(0, 24)], [products]);
  const sections = useMemo<Section[]>(() => {
    const categoryProducts = category === 'Все' ? products : products.filter((item) => item.category === category);
    if (debounced.trim()) {
      const grouped = groupProductsBySource(searchProducts(categoryProducts, debounced).slice(0, 100));
      return [{ title: 'Мои продукты и рецепты', data: grouped.my }, { title: 'Точка Роста', data: grouped.tochka }, { title: 'Обычные продукты', data: grouped.common }, { title: 'По штрихкоду', data: grouped.barcode }].filter((section) => section.data.length);
    }
    const categoryFilter = (list: Product[]) => category === 'Все' ? list : list.filter((item) => item.category === category);if(params.mode==='recent')return[{title:'Недавние',data:categoryFilter(recent)}].filter((section)=>section.data.length);if(params.mode==='favorites')return[{title:'Избранное',data:categoryProducts.filter((item)=>item.isFavorite)}].filter((section)=>section.data.length);
    return [{ title: 'Недавние', data: categoryFilter(recent) }, { title: 'Часто добавляешь', data: categoryFilter(frequent) }, { title: 'Избранное', data: categoryProducts.filter((item) => item.isFavorite).slice(0, 16) }, { title: category === 'Все' ? 'Начать поиск' : category, data: category === 'Все' ? [] : categoryProducts.slice(0, 60) }].filter((section) => section.data.length);
  }, [category, debounced, frequent, params.mode, products, recent]);

  const submitHistory = (value: string) => { setQuery(value); setDebounced(value); void recordSearch(value); };
  return <>
    <AppBackground><SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}><AppText>‹</AppText></Pressable><View style={[styles.search, { backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]}><AppText tone="muted">⌕</AppText><TextInput autoFocus value={query} onChangeText={setQuery} onSubmitEditing={() => submitHistory(query)} placeholder="Продукт, блюдо или бренд" placeholderTextColor={colors.textMuted} returnKeyType="search" style={[styles.input, { color: colors.textPrimary }]} />{query ? <Pressable onPress={() => setQuery('')}><AppText tone="muted">×</AppText></Pressable> : null}</View><Pressable accessibilityLabel="Сканировать код" onPress={() => router.push('/scanner')} style={[styles.close, { backgroundColor: colors.greenGlow }]}><AppIcon name="qr" color={colors.greenBright} /></Pressable></View>
      <SectionList sections={sections} keyExtractor={(item, index) => `${item.id}-${index}`} stickySectionHeadersEnabled={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + spacing.xl }]}
        ListHeaderComponent={<View style={styles.top}>{!query && history.length ? <View style={styles.historyHead}><AppText variant="caption" tone="muted">НЕДАВНИЕ ЗАПРОСЫ</AppText><Pressable onPress={() => { void clearSearchHistory().then(() => setHistory([])); }}><AppText variant="caption" tone="green">Очистить</AppText></Pressable></View> : null}{!query && history.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{history.map((item) => <FilterChip key={item.id} label={item.query} onPress={() => submitHistory(item.query)} />)}</ScrollView> : null}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{categories.map((item) => <FilterChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView><View style={styles.create}><Pressable onPress={() => router.push('/product/new')} style={[styles.createButton, { borderColor: colors.glassBorder }]}><AppText tone="green">+</AppText><AppText variant="caption">Свой продукт</AppText></Pressable><Pressable onPress={() => router.push('/recipe/new')} style={[styles.createButton, { borderColor: colors.glassBorder }]}><AppText tone="green">+</AppText><AppText variant="caption">Свой рецепт</AppText></Pressable></View></View>}
        renderSectionHeader={({ section }) => <AppText variant="heading" style={styles.sectionTitle}>{section.title}</AppText>}
        renderItem={({ item }) => <ProductListRow product={item} onOpen={() => router.push(`/product/${item.id}` as never)} onAdd={() => setSelected(item)} onFavorite={() => { void toggleFavorite(item.id); }} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<View style={styles.empty}><AppText variant="heading">{query ? 'Ничего не найдено' : 'Что добавим?'}</AppText><AppText tone="secondary" style={styles.center}>{query ? 'Проверь запрос, выбери другую категорию или создай свой продукт.' : 'Начни вводить название. Поиск работает локально и понимает небольшие опечатки.'}</AppText></View>}
      /></SafeAreaView></AppBackground>
    <AddToDiarySheet product={selected} visible={selected !== null} initialMeal={initialMeal} date={date} onClose={() => setSelected(null)} onAdd={async (meal, servings, quantityG) => { if (!selected) return; await addToDiary({ product: selected, mealType: meal, servings, quantityG, date }); Alert.alert('Добавлено', `${selected.name} · ${date}`); }} />
  </>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, close: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, search: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md }, input: { flex: 1, fontSize: 16 }, content: { paddingHorizontal: spacing.md }, top: { gap: spacing.md, paddingBottom: spacing.md }, historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, horizontal: { gap: spacing.sm },
  create: { flexDirection: 'row', gap: spacing.sm }, createButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, sectionTitle: { paddingTop: spacing.md, paddingBottom: spacing.sm }, separator: { height: spacing.sm }, empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }, center: { textAlign: 'center' },
});
