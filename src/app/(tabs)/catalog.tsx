import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { ProductListRow } from '@/components/ProductListRow';
import { QuickAddButton, QuickAddSheet } from '@/components/QuickAddSheet';
import { getTabContentPadding } from '@/services/tabBarMetrics';
import { getNextMealType } from '@/services/diaryMath';
import { searchProducts } from '@/services/productSearch';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { MealType, Product } from '@/types/domain';

type Filter = 'all' | 'favorites' | 'my' | 'tochka' | 'common' | 'barcode';
const filters: { value: Filter; label: string }[] = [{ value: 'all', label: 'Все' }, { value: 'favorites', label: 'Избранное' }, { value: 'my', label: 'Мои' }, { value: 'tochka', label: 'Точка Роста' }, { value: 'common', label: 'Обычные' }, { value: 'barcode', label: 'По коду' }];
const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ meal?: string }>(); const insets = useSafeAreaInsets(); const { colors } = useTheme();
  const products = useAppStore((state) => state.products); const diaryDate = useAppStore((state) => state.diaryDate); const addToDiary = useAppStore((state) => state.addToDiary); const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<Filter>('all'); const [category, setCategory] = useState('Все'); const [selected, setSelected] = useState<Product | null>(null);
  const[quick,setQuick]=useState(false);const scrollY=useRef(new Animated.Value(0)).current;
  const categories = useMemo(() => ['Все', ...Array.from(new Set(products.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'ru'))], [products]);
  const filtered = useMemo(() => searchProducts(products.filter((product) => {
    if (category !== 'Все' && product.category !== category) return false;
    if (filter === 'favorites') return product.isFavorite; if (filter === 'my') return product.isUserCreated; if (filter === 'tochka') return product.sourceType === 'tochka_rosta'; if (filter === 'common') return product.sourceType === 'usda'; if (filter === 'barcode') return product.sourceType === 'open_food_facts'; return true;
  }), query), [category, filter, products, query]);
  const meal = meals.includes(params.meal as MealType) ? params.meal as MealType : getNextMealType();

  return <>
    <AppBackground><SafeAreaView style={styles.safe} edges={['top']}><Animated.View style={[styles.title,{height:scrollY.interpolate({inputRange:[0,80],outputRange:[88,60],extrapolate:'clamp'}),backgroundColor:colors.backgroundPrimary}]}><Animated.View style={{transform:[{scale:scrollY.interpolate({inputRange:[0,80],outputRange:[1,.84],extrapolate:'clamp'})}]}}><AppText variant="title">Каталог</AppText><Animated.View style={{opacity:scrollY.interpolate({inputRange:[0,40],outputRange:[1,0],extrapolate:'clamp'})}}><AppText tone="secondary">{products.length} продуктов доступны локально</AppText></Animated.View></Animated.View><Pressable accessibilityLabel="Сканировать код" style={[styles.iconButton, { backgroundColor: colors.greenGlow, borderColor: colors.glassBorder }]} onPress={() => router.push('/scanner')}><AppIcon name="qr" color={colors.greenBright} /></Pressable></Animated.View>
      <Animated.FlatList<Product> data={filtered} keyExtractor={(item) => String(item.id)} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" initialNumToRender={10} windowSize={7} removeClippedSubviews onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:false})} scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: getTabContentPadding(insets.bottom) }]}
        ListHeaderComponent={<View style={styles.header}><View style={[styles.search, { borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong }]}><AppText tone="muted">⌕</AppText><TextInput value={query} onChangeText={setQuery} placeholder="Найти продукт или блюдо" placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.textPrimary }]} returnKeyType="search" /><Pressable accessibilityLabel="Открыть полный поиск" onPress={() => router.push('/food-search' as never)}><AppText tone="green">›</AppText></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{filters.map((item) => <FilterChip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />)}</ScrollView><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{categories.map((item) => <FilterChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView><View style={styles.actions}><Pressable style={[styles.action, { borderColor: colors.glassBorder }]} onPress={() => router.push('/product/new')}><AppText tone="green">+</AppText><AppText variant="caption">Создать продукт</AppText></Pressable><Pressable style={[styles.action, { borderColor: colors.glassBorder }]} onPress={() => router.push('/recipe/new')}><AppText tone="green">+</AppText><AppText variant="caption">Собрать рецепт</AppText></Pressable></View><QuickAddButton onPress={()=>setQuick(true)}/><View style={styles.count}><AppText variant="heading">{category === 'Все' ? 'Продукты' : category}</AppText><AppText variant="caption" tone="muted">{filtered.length}</AppText></View></View>}
        renderItem={({ item }) => <ProductListRow product={item} onOpen={() => router.push(`/product/${item.id}` as never)} onAdd={() => setSelected(item)} onFavorite={() => { void toggleFavorite(item.id); }} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<View style={styles.empty}><AppText variant="heading">Ничего не найдено</AppText><AppText tone="secondary">Сбрось фильтр или создай собственный продукт.</AppText></View>}
      /></SafeAreaView></AppBackground>
    <AddToDiarySheet product={selected} visible={selected !== null} initialMeal={meal} date={diaryDate} onClose={() => setSelected(null)} onAdd={async (mealType, servings, quantityG) => { if (!selected) return; await addToDiary({ product: selected, mealType, servings, quantityG }); Alert.alert('Добавлено', selected.name); }} />
    <QuickAddSheet visible={quick} onClose={()=>setQuick(false)} date={diaryDate} mealType={meal}/>
  </>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, title: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }, iconButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, borderWidth: 1 },
  content: { paddingHorizontal: spacing.md }, header: { gap: spacing.md, paddingBottom: spacing.md }, search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1 }, searchInput: { flex: 1, fontSize: 16 }, horizontal: { gap: spacing.sm }, actions: { flexDirection: 'row', gap: spacing.sm }, action: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, count: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, separator: { height: spacing.sm }, empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
});
