import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, InteractionManager, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { ProductListRow } from '@/components/ProductListRow';
import { QuickAddButton, QuickAddSheet } from '@/components/QuickAddSheet';
import { ProductCardSkeleton, ScreenState } from '@/components/ScreenStates';
import { countProducts, loadProductCategories, loadProductsPage, PRODUCT_PAGE_SIZE, type ProductPageOptions } from '@/database/repositories/productRepository';
import { useRenderTracker } from '@/performance/renderTracker';
import { useScreenProfiler } from '@/performance/screenProfiler';
import { setPerformanceMetric } from '@/performance/performanceLogger';
import { getTabContentPadding } from '@/services/tabBarMetrics';
import { getNextMealType } from '@/services/diaryMath';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { motion, radii, spacing } from '@/theme/tokens';
import type { FoodSourceType, MealType, Product } from '@/types/domain';
import { createSectionErrorBoundary } from '@/components/ScreenErrorFallback';

export const ErrorBoundary = createSectionErrorBoundary('CatalogScreen');

type Filter = 'all' | 'favorites' | 'my' | 'tochka' | 'common' | 'barcode';
const filters: { value: Filter; label: string }[] = [{ value: 'all', label: 'Все' }, { value: 'favorites', label: 'Избранное' }, { value: 'my', label: 'Мои' }, { value: 'tochka', label: 'Точка Роста' }, { value: 'common', label: 'Обычные' }, { value: 'barcode', label: 'По коду' }];
const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function pageOptions(filter: Filter, category: string, query: string): ProductPageOptions {
  const sourceMap: Partial<Record<Filter, FoodSourceType>> = { tochka: 'tochka_rosta', common: 'usda', barcode: 'open_food_facts' };
  return { category, query: query.trim() || undefined, favoritesOnly: filter === 'favorites', userCreatedOnly: filter === 'my', sourceType: sourceMap[filter] };
}

export default function CatalogScreen() {
  useRenderTracker('CatalogScreen');
  useScreenProfiler('catalog');
  const params = useLocalSearchParams<{ meal?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const diaryDate = useAppStore((state) => state.diaryDate);
  const addToDiary = useAppStore((state) => state.addToDiary);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState('Все');
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quick, setQuick] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const requestId = useRef(0);
  const generation = useRef(0);
  const meal = meals.includes(params.meal as MealType) ? params.meal as MealType : getNextMealType();

  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query), 320); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    let delayFinished = false;
    let interactionsFinished = false;
    let active = true;
    const reveal = () => {
      if (active && delayFinished && interactionsFinished) setCatalogReady(true);
    };
    const timer = setTimeout(() => {
      delayFinished = true;
      reveal();
    }, motion.tabDataDelay);
    const task = InteractionManager.runAfterInteractions(() => {
      interactionsFinished = true;
      reveal();
    });
    return () => { active = false; task.cancel(); clearTimeout(timer); };
  }, []);
  useEffect(() => {
    if (!catalogReady) return;
    let active = true;
    void loadProductCategories().then((items) => { if (active) setCategories(items); });
    return () => { active = false; };
  }, [catalogReady]);
  useEffect(() => {
    if (!catalogReady) return;
    let active = true;
    const id = ++requestId.current;
    generation.current += 1;
    setLoading(true);
    setLoadError(null);
    const options = pageOptions(filter, category, debouncedQuery);
    void Promise.all([loadProductsPage({ ...options, limit: PRODUCT_PAGE_SIZE, offset: 0 }), countProducts(options)])
      .then(([items, count]) => {
        if (!active || id !== requestId.current) return;
        setProducts(items); setTotal(Math.max(count, items.length)); setPerformanceMetric('currentListSize', items.length);
      })
      .catch((error) => {
        if (active && id === requestId.current) {
          setProducts([]);
          setTotal(0);
          setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить продукты');
        }
      })
      .finally(() => { if (active && id === requestId.current) setLoading(false); });
    return () => { active = false; };
  }, [catalogReady, category, debouncedQuery, filter, retryKey]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || products.length >= total) return;
    const currentGeneration = generation.current;
    setLoadingMore(true);
    try {
      const next = await loadProductsPage({ ...pageOptions(filter, category, debouncedQuery), limit: PRODUCT_PAGE_SIZE, offset: products.length });
      if (currentGeneration !== generation.current) return;
      setProducts((current) => {
        const known = new Set(current.map((item) => item.id));
        const merged = [...current, ...next.filter((item) => !known.has(item.id))];
        setPerformanceMetric('currentListSize', merged.length);
        return merged;
      });
    } finally { if (currentGeneration === generation.current) setLoadingMore(false); }
  }, [category, debouncedQuery, filter, loading, loadingMore, products.length, total]);

  const handleFavorite = useCallback(async (product: Product) => {
    const isFavorite = await toggleFavorite(product.id);
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isFavorite } : item));
  }, [toggleFavorite]);
  const openProduct = useCallback((product: Product) => router.push(`/product/${product.id}` as never), []);
  const selectProduct = useCallback((product: Product) => setSelected(product), []);
  const favoriteProduct = useCallback((product: Product) => { void handleFavorite(product); }, [handleFavorite]);
  const renderProduct = useCallback(({ item }: { item: Product }) => <ProductListRow product={item} onOpen={openProduct} onAdd={selectProduct} onFavorite={favoriteProduct} />, [favoriteProduct, openProduct, selectProduct]);

  return <>
    <AppBackground><SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.title, { backgroundColor: colors.backgroundPrimary }]}><View><AppText variant="title">Каталог</AppText><AppText tone="secondary">{loadError ? 'Каталог временно недоступен' : total ? `${total} продуктов доступны локально` : loading ? 'Загружаем первую страницу…' : 'Продукты не найдены'}</AppText></View><Pressable accessibilityLabel="Сканировать код" style={[styles.iconButton, { backgroundColor: colors.greenGlow, borderColor: colors.glassBorder }]} onPress={() => router.push('/scanner')}><AppIcon name="qr" color={colors.greenBright} /></Pressable></View>
      <FlatList data={products} keyExtractor={(item) => String(item.id)} renderItem={renderProduct} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" initialNumToRender={8} maxToRenderPerBatch={8} updateCellsBatchingPeriod={48} windowSize={5} removeClippedSubviews onEndReached={() => { void loadMore(); }} onEndReachedThreshold={0.55}
        contentContainerStyle={[styles.content, { paddingBottom: getTabContentPadding(insets.bottom) }]}
        ListHeaderComponent={<View style={styles.header}><View style={[styles.search, { borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong }]}><AppText tone="muted">⌕</AppText><TextInput value={query} onChangeText={setQuery} placeholder="Найти продукт или блюдо" placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.textPrimary }]} returnKeyType="search" /><Pressable accessibilityLabel="Открыть полный поиск" onPress={() => router.push('/food-search' as never)}><AppText tone="green">›</AppText></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{filters.map((item) => <FilterChip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />)}</ScrollView><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{['Все', ...categories].map((item) => <FilterChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView><View style={styles.actions}><Pressable style={[styles.action, { borderColor: colors.glassBorder }]} onPress={() => router.push('/product/new')}><AppText tone="green">+</AppText><AppText variant="caption">Создать продукт</AppText></Pressable><Pressable style={[styles.action, { borderColor: colors.glassBorder }]} onPress={() => router.push('/recipe/new')}><AppText tone="green">+</AppText><AppText variant="caption">Собрать рецепт</AppText></Pressable></View><QuickAddButton onPress={() => setQuick(true)} /><View style={styles.count}><AppText variant="heading">{category === 'Все' ? 'Продукты' : category}</AppText><AppText variant="caption" tone="muted">{products.length} из {total}</AppText></View></View>}
        ItemSeparatorComponent={Separator}
        ListFooterComponent={loadingMore ? <AppText tone="muted" style={styles.loading}>Загружаем ещё…</AppText> : null}
        ListEmptyComponent={loading ? <ProductCardSkeleton /> : loadError ? <ScreenState tone="error" icon="catalog" title="Не удалось загрузить продукты" message="Локальные данные не изменены. Попробуй открыть каталог ещё раз." actionLabel="Попробовать снова" onAction={() => setRetryKey((value) => value + 1)} /> : <ScreenState icon="catalog" title="По этому запросу ничего не найдено" message="Измени запрос или создай собственный продукт." actionLabel="Сбросить фильтры" onAction={() => { setQuery(''); setFilter('all'); setCategory('Все'); }} secondaryActionLabel="Создать свой продукт" onSecondaryAction={() => router.push('/product/new')} />}
      />
    </SafeAreaView></AppBackground>
    {selected ? <AddToDiarySheet product={selected} visible initialMeal={meal} date={diaryDate} onClose={() => setSelected(null)} onAdd={async (mealType, servings, quantityG) => { await addToDiary({ product: selected, mealType, servings, quantityG }); Alert.alert('Добавлено', selected.name); }} /> : null}
    {quick ? <QuickAddSheet visible onClose={() => setQuick(false)} date={diaryDate} mealType={meal} /> : null}
  </>;
}

function Separator() { return <View style={styles.separator} />; }
const styles = StyleSheet.create({
  safe: { flex: 1 }, title: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }, iconButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, borderWidth: 1 },
  content: { paddingHorizontal: spacing.md }, header: { gap: spacing.md, paddingBottom: spacing.md }, search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1 }, searchInput: { flex: 1, fontSize: 16 }, horizontal: { gap: spacing.sm }, actions: { flexDirection: 'row', gap: spacing.sm }, action: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, count: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, separator: { height: spacing.sm }, loading: { textAlign: 'center', paddingVertical: spacing.md },
});
