import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppBackButton } from '@/components/AppBackButton';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { ProductListRow } from '@/components/ProductListRow';
import { ProductCardSkeleton, ScreenState } from '@/components/ScreenStates';
import { countProducts, loadProductCategories, loadProductsPage, PRODUCT_PAGE_SIZE } from '@/database/repositories/productRepository';
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
  const [total, setTotal] = useState(0);
  const [contextLoading, setContextLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [requestGuard] = useState(createLatestRequestGuard);
  const date = params.date ?? diaryDate;
  const initialMeal = mealTypes.includes(params.meal as MealType) ? params.meal as MealType : getNextMealType();

  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 320); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    let active = true;
    setContextLoading(true);
    void Promise.all([loadSearchHistory(), loadRecentProducts(), loadFrequentProducts(), loadProductCategories()])
      .then(([h, r, f, c]) => { if (active) { setHistory(h); setRecent(r); setFrequent(f); setCategories(c); } })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Не удалось открыть поиск'); })
      .finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [retryKey]);
  useEffect(() => {
    const normalized = debounced.trim();
    const shouldQuery = normalized.length >= 2 || category !== 'Все' || params.mode === 'favorites';
    if (!shouldQuery) { requestGuard.invalidate(); setResults([]); setTotal(0); setSearchLoading(false); setLoadError(null); setPerformanceMetric('currentListSize', 0); return; }
    const request = requestGuard.next();
    const options = { query: normalized.length >= 2 ? normalized : undefined, category, favoritesOnly: params.mode === 'favorites' };
    setSearchLoading(true);
    setLoadError(null);
    void Promise.all([loadProductsPage({ ...options, limit: PRODUCT_PAGE_SIZE, offset: 0 }), countProducts(options)])
      .then(([items, count]) => { if (requestGuard.isCurrent(request)) { setResults(items); setTotal(Math.max(count, items.length)); setPerformanceMetric('currentListSize', items.length); } })
      .catch((error) => { if (requestGuard.isCurrent(request)) setLoadError(error instanceof Error ? error.message : 'Не удалось выполнить поиск'); })
      .finally(() => { if (requestGuard.isCurrent(request)) setSearchLoading(false); });
    return () => requestGuard.invalidate();
  }, [category, debounced, params.mode, requestGuard, retryKey]);
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
  const loadMore = useCallback(async () => {
    const normalized = debounced.trim();
    if (searchLoading || loadingMore || loadError || results.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await loadProductsPage({ query: normalized.length >= 2 ? normalized : undefined, category, favoritesOnly: params.mode === 'favorites', limit: PRODUCT_PAGE_SIZE, offset: results.length });
      setResults((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...next.filter((item) => !known.has(item.id))];
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить следующую страницу');
    } finally {
      setLoadingMore(false);
    }
  }, [category, debounced, loadError, loadingMore, params.mode, results.length, searchLoading, total]);

  return <>
    <AppBackground><SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><AppBackButton fallbackRoute="/(tabs)/catalog" /><View style={[styles.search, { backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]}><AppText tone="muted">⌕</AppText><TextInput autoFocus value={query} onChangeText={setQuery} onSubmitEditing={() => submitHistory(query)} placeholder="Продукт, блюдо или бренд" placeholderTextColor={colors.textMuted} returnKeyType="search" style={[styles.input, { color: colors.textPrimary }]} />{query ? <Pressable onPress={() => setQuery('')}><AppText tone="muted">×</AppText></Pressable> : null}</View><Pressable accessibilityLabel="Сканировать код" onPress={() => router.push('/scanner')} style={[styles.close, { backgroundColor: colors.greenGlow }]}><AppIcon name="qr" color={colors.greenBright} /></Pressable></View>
      <SectionList sections={sections} keyExtractor={(item) => String(item.id)} renderItem={renderProduct} stickySectionHeadersEnabled={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews onEndReached={() => { void loadMore(); }} onEndReachedThreshold={0.55}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + spacing.xl }]}
        ListHeaderComponent={<View style={styles.top}>{!query && history.length ? <View style={styles.historyHead}><AppText variant="caption" tone="muted">НЕДАВНИЕ ЗАПРОСЫ</AppText><Pressable onPress={() => { void clearSearchHistory().then(() => setHistory([])); }}><AppText variant="caption" tone="green">Очистить</AppText></Pressable></View> : null}{!query && history.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{history.map((item) => <FilterChip key={item.id} label={item.query} onPress={() => submitHistory(item.query)} />)}</ScrollView> : null}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{['Все', ...categories].map((item) => <FilterChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView><View style={styles.create}><Pressable onPress={() => router.push('/product/new')} style={[styles.createButton, { borderColor: colors.glassBorder }]}><AppText tone="green">+</AppText><AppText variant="caption">Свой продукт</AppText></Pressable><Pressable onPress={() => router.push('/recipe/new')} style={[styles.createButton, { borderColor: colors.glassBorder }]}><AppText tone="green">+</AppText><AppText variant="caption">Свой рецепт</AppText></Pressable></View></View>}
        renderSectionHeader={({ section }) => <AppText variant="heading" style={styles.sectionTitle}>{section.title}</AppText>}
        ItemSeparatorComponent={Separator}
        ListFooterComponent={loadingMore ? <AppText tone="muted" style={styles.loading}>Загружаем ещё…</AppText> : null}
        ListEmptyComponent={contextLoading || searchLoading ? <ProductCardSkeleton /> : loadError ? <ScreenState tone="error" icon="catalog" title="Не удалось загрузить продукты" message="Поиск работает локально. Данные не изменены — попробуй ещё раз." actionLabel="Попробовать снова" onAction={() => setRetryKey((value) => value + 1)} secondaryActionLabel="Открыть каталог" onSecondaryAction={() => router.push('/(tabs)/catalog')} /> : <ScreenState icon="catalog" title={query ? 'По этому запросу ничего не найдено' : 'Что добавим?'} message={query ? 'Измени запрос или создай свой продукт.' : 'Начни вводить название или выбери недавний продукт.'} actionLabel={query ? 'Изменить запрос' : 'Открыть каталог'} onAction={() => query ? setQuery('') : router.push('/(tabs)/catalog')} secondaryActionLabel="Создать свой продукт" onSecondaryAction={() => router.push('/product/new')} />}
      /></SafeAreaView></AppBackground>
    {selected ? <AddToDiarySheet product={selected} visible initialMeal={initialMeal} date={date} onClose={() => setSelected(null)} onAdd={async (meal, servings, quantityG) => { await addToDiary({ product: selected, mealType: meal, servings, quantityG, date }); Alert.alert('Добавлено', `${selected.name} · ${date}`); }} /> : null}
  </>;
}

function Separator() { return <View style={styles.separator} />; }
const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, close: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, search: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md }, input: { flex: 1, fontSize: 16 }, content: { paddingHorizontal: spacing.md }, top: { gap: spacing.md, paddingBottom: spacing.md }, historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, horizontal: { gap: spacing.sm },
  create: { flexDirection: 'row', gap: spacing.sm }, createButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, sectionTitle: { paddingTop: spacing.md, paddingBottom: spacing.sm }, separator: { height: spacing.sm }, loading: { textAlign: 'center', paddingVertical: spacing.md },
});
