import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { ProductListRow } from '@/components/ProductListRow';
import { loadProductCategories, loadProductsPage } from '@/database/repositories/productRepository';
import { clearSearchHistory, loadFrequentProducts, loadRecentProducts, loadSearchHistory, recordSearch } from '@/database/repositories/searchRepository';
import { useRenderTracker } from '@/performance/renderTracker';
import { useScreenProfiler } from '@/performance/screenProfiler';
import { setPerformanceMetric } from '@/performance/performanceLogger';
import { getNextMealType } from '@/services/diaryMath';
import { createLatestRequestGuard } from '@/services/latestRequest';
import { groupProductsBySource } from '@/services/productSearch';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { MealType, Product, SearchHistoryItem } from '@/types/domain';

interface Section { title: string; data: Product[]; }
const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function FoodSearchScreen() {
  useRenderTracker('FoodSearchScreen');
  useScreenProfiler('food_search');
  const params = useLocalSearchParams<{ meal?: string; date?: string; mode?: 'search' | 'recent' | 'favorites' }>();
  const diaryDate = useAppStore((state) => state.diaryDate);
  const addToDiary = useAppStore((state) => state.addToDiary);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('Все');
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [frequent, setFrequent] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [requestGuard] = useState(createLatestRequestGuard);
  const date = params.date ?? diaryDate;
  const initialMeal = mealTypes.includes(params.meal as MealType) ? params.meal as MealType : getNextMealType();

  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 320); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    let active = true;
    void Promise.all([loadSearchHistory(), loadRecentProducts(), loadFrequentProducts(), loadProductCategories()]).then(([h, r, f, c]) => { if (active) { setHistory(h); setRecent(r); setFrequent(f); setCategories(c); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const normalized = debounced.trim();
    const shouldQuery = normalized.length >= 2 || category !== 'Все' || params.mode === 'favorites';
    if (!shouldQuery) { requestGuard.invalidate(); setResults([]); setPerformanceMetric('currentListSize', 0); return; }
    const request = requestGuard.next();
    void loadProductsPage({ query: normalized.length >= 2 ? normalized : undefined, category, favoritesOnly: params.mode === 'favorites', limit: 80 })
      .then((items) => { if (requestGuard.isCurrent(request)) { setResults(items); setPerformanceMetric('currentListSize', items.length); } })
      .catch((error) => { if (__DEV__ && requestGuard.isCurrent(request)) console.warn('[FoodSearch] query', error); });
    return () => requestGuard.invalidate();
  }, [category, debounced, params.mode, requestGuard]);
  useEffect(() => {
    if (debounced.trim().length < 2) return;
    let active = true;
    const timer = setTimeout(() => { void recordSearch(debounced).then(() => loadSearchHistory()).then((items) => { if (active) setHistory(items); }); }, 700);
    return () => { active = false; clearTimeout(timer); };
  }, [debounced]);

  const sections = useMemo<Section[]>(() => {
    const categoryFilter = (list: Product[]) => category === 'Все' ? list : list.filter((item) => item.category === category);
    if (debounced.trim().length >= 2) {
      const grouped = groupProductsBySource(results);
      return [{ title: 'Мои продукты и рецепты', data: grouped.my }, { title: 'Точка Роста', data: grouped.tochka }, { title: 'Обычные продукты', data: grouped.common }, { title: 'По штрихкоду', data: grouped.barcode }].filter((section) => section.data.length);
    }
    if (params.mode === 'recent') return [{ title: 'Недавние', data: categoryFilter(recent) }].filter((section) => section.data.length);
    if (params.mode === 'favorites') return [{ title: 'Избранное', data: results }].filter((section) => section.data.length);
    if (category !== 'Все') return [{ title: category, data: results }].filter((section) => section.data.length);
    return [{ title: 'Недавние', data: recent }, { title: 'Часто добавляешь', data: frequent }].filter((section) => section.data.length);
  }, [category, debounced, frequent, params.mode, recent, results]);

  const submitHistory = (value: string) => { setQuery(value); setDebounced(value); void recordSearch(value); };
  const handleFavorite = useCallback(async (product: Product) => {
    const isFavorite = await toggleFavorite(product.id);
    const update = (items: Product[]) => items.map((item) => item.id === product.id ? { ...item, isFavorite } : item);
    setResults(update); setRecent(update); setFrequent(update);
  }, [toggleFavorite]);
  const openProduct = useCallback((product: Product) => router.push(`/product/${product.id}` as never), []);
  const selectProduct = useCallback((product: Product) => setSelected(product), []);
  const favoriteProduct = useCallback((product: Product) => { void handleFavorite(product); }, [handleFavorite]);
  const renderProduct = useCallback(({ item }: { item: Product }) => <ProductListRow product={item} onOpen={openProduct} onAdd={selectProduct} onFavorite={favoriteProduct} />, [favoriteProduct, openProduct, selectProduct]);

  return <>
    <AppBackground><SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}><AppText>‹</AppText></Pressable><View style={[styles.search, { backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]}><AppText tone="muted">⌕</AppText><TextInput autoFocus value={query} onChangeText={setQuery} onSubmitEditing={() => submitHistory(query)} placeholder="Продукт, блюдо или бренд" placeholderTextColor={colors.textMuted} returnKeyType="search" style={[styles.input, { color: colors.textPrimary }]} />{query ? <Pressable onPress={() => setQuery('')}><AppText tone="muted">×</AppText></Pressable> : null}</View><Pressable accessibilityLabel="Сканировать код" onPress={() => router.push('/scanner')} style={[styles.close, { backgroundColor: colors.greenGlow }]}><AppIcon name="qr" color={colors.greenBright} /></Pressable></View>
      <SectionList sections={sections} keyExtractor={(item) => String(item.id)} renderItem={renderProduct} stickySectionHeadersEnabled={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + spacing.xl }]}
        ListHeaderComponent={<View style={styles.top}>{!query && history.length ? <View style={styles.historyHead}><AppText variant="caption" tone="muted">НЕДАВНИЕ ЗАПРОСЫ</AppText><Pressable onPress={() => { void clearSearchHistory().then(() => setHistory([])); }}><AppText variant="caption" tone="green">Очистить</AppText></Pressable></View> : null}{!query && history.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{history.map((item) => <FilterChip key={item.id} label={item.query} onPress={() => submitHistory(item.query)} />)}</ScrollView> : null}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{['Все', ...categories].map((item) => <FilterChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView><View style={styles.create}><Pressable onPress={() => router.push('/product/new')} style={[styles.createButton, { borderColor: colors.glassBorder }]}><AppText tone="green">+</AppText><AppText variant="caption">Свой продукт</AppText></Pressable><Pressable onPress={() => router.push('/recipe/new')} style={[styles.createButton, { borderColor: colors.glassBorder }]}><AppText tone="green">+</AppText><AppText variant="caption">Свой рецепт</AppText></Pressable></View></View>}
        renderSectionHeader={({ section }) => <AppText variant="heading" style={styles.sectionTitle}>{section.title}</AppText>}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={<View style={styles.empty}><AppText variant="heading">{query ? 'Ничего не найдено' : 'Что добавим?'}</AppText><AppText tone="secondary" style={styles.center}>{query ? 'Проверь запрос, выбери другую категорию или создай свой продукт.' : 'Начни вводить название. Поиск выполняется локально после короткой паузы.'}</AppText></View>}
      /></SafeAreaView></AppBackground>
    {selected ? <AddToDiarySheet product={selected} visible initialMeal={initialMeal} date={date} onClose={() => setSelected(null)} onAdd={async (meal, servings, quantityG) => { await addToDiary({ product: selected, mealType: meal, servings, quantityG, date }); Alert.alert('Добавлено', `${selected.name} · ${date}`); }} /> : null}
  </>;
}

function Separator() { return <View style={styles.separator} />; }
const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, close: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, search: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md }, input: { flex: 1, fontSize: 16 }, content: { paddingHorizontal: spacing.md }, top: { gap: spacing.md, paddingBottom: spacing.md }, historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, horizontal: { gap: spacing.sm },
  create: { flexDirection: 'row', gap: spacing.sm }, createButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, sectionTitle: { paddingTop: spacing.md, paddingBottom: spacing.sm }, separator: { height: spacing.sm }, empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }, center: { textAlign: 'center' },
});
