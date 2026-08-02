import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RhythmCharacter } from '@/features/rhythm/components/RhythmCharacter';
import { loadProductsPage } from '@/database/repositories/productRepository';
import { mealLabels } from '@/constants/options';
import { calculateForWeight } from '@/services/foodMath';
import { getNextMealType } from '@/services/diaryMath';
import { safelyRunHaptic } from '@/services/haptics';
import { useAppStore } from '@/store/appStore';
import type { MealType, Product } from '@/types/domain';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const commonQueries = ['Яйцо', 'Банан', 'Овсянка', 'Творог', 'Куриная грудка', 'Рис', 'Хлеб', 'Йогурт'];

interface AddedEntry {
  productName: string;
  quantityG: number;
  calories: number;
  meal: MealType;
}

export default function FirstEntryScreen() {
  const { colors } = useTheme();
  const addToDiary = useAppStore((state) => state.addToDiary);
  const markFirstEntry = useAppStore((state) => state.markOnboardingFirstEntry);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<AddedEntry | null>(null);
  const addingRef = useRef(false);
  const defaultMeal = useMemo(() => getNextMealType(), []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const request = query.trim()
        ? loadProductsPage({ query, limit: 8 })
        : Promise.all(commonQueries.map((name) => loadProductsPage({ query: name, limit: 1 }))).then((groups) => {
          const unique = new Map<number, Product>();
          groups.flat().forEach((product) => unique.set(product.id, product));
          return [...unique.values()].slice(0, 8);
        });
      void request.then((items) => { if (active) setProducts(items); })
        .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Не удалось открыть каталог'); })
        .finally(() => { if (active) setLoading(false); });
    }, query.trim() ? 220 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  const add = async (meal: MealType, servings: number, quantityG: number) => {
    if (!selected || addingRef.current || added) return;
    addingRef.current = true;
    try {
      const values = calculateForWeight(selected, quantityG);
      await addToDiary({ product: selected, mealType: meal, servings, quantityG });
      await markFirstEntry();
      await safelyRunHaptic('success');
      setAdded({ productName: selected.name, quantityG, calories: Math.round(values.calories), meal });
      setSelected(null);
    } finally {
      addingRef.current = false;
    }
  };

  const openDay = async () => {
    setFinishing(true);
    try {
      await completeOnboarding({ firstEntryCompleted: true });
      router.replace('/(tabs)/diary');
    } finally {
      setFinishing(false);
    }
  };

  const skip = async () => {
    setFinishing(true);
    try {
      await completeOnboarding({ wasSkipped: true });
      router.replace('/(tabs)');
    } finally {
      setFinishing(false);
    }
  };

  if (added) {
    return <OnboardingShell step={{ current: 5, total: 5 }} title="Первая запись готова" description="Баланс уже обновился."
      footer={<PrimaryButton label="Открыть мой день" loading={finishing} onPress={openDay} />}>
      <View style={styles.successRhythm}><RhythmCharacter size="large" emotion="happy" action="celebrate" label="Ритм радуется первой записи" /></View>
      <GlassCard variant="accent" accessibilityLabel={`${added.productName}, ${Math.round(added.quantityG)} граммов, ${added.calories} килокалорий, ${mealLabels[added.meal]}`}>
        <AppText variant="heading">{added.productName}</AppText>
        <AppText tone="secondary">{Math.round(added.quantityG)} г · {added.calories} ккал · {mealLabels[added.meal]}</AppText>
      </GlassCard>
      <AppText>«Отличное начало. Сегодняшний баланс уже считается.»</AppText>
    </OnboardingShell>;
  }

  return <>
    <OnboardingShell showBack fallbackRoute="/(onboarding)/calculation" step={{ current: 5, total: 5 }} title="Что ты уже ел сегодня?" description="Выбери продукт из реального каталога. Запись появится только после подтверждения."
      footer={<View style={styles.actions}><PrimaryButton label="Пропустить первую запись" secondary loading={finishing} onPress={skip} /></View>}>
      <View style={[styles.search, { backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]}>
        <AppText tone="muted">⌕</AppText>
        <TextInput accessibilityLabel="Поиск продукта" value={query} onChangeText={setQuery} returnKeyType="search" placeholder="Найти продукт" placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.textPrimary }]} />
      </View>
      {loading ? <AppText tone="secondary">Открываем каталог…</AppText> : null}
      {!loading && !products.length ? <GlassCard variant="compact"><AppText>Ничего не найдено</AppText><AppText variant="caption" tone="secondary">Попробуй другое название или пропусти шаг.</AppText></GlassCard> : null}
      <View style={styles.grid}>{products.map((product) => <GlassCard key={product.id} variant="interactive" onPress={() => setSelected(product)} accessibilityLabel={`Выбрать ${product.name}`} style={styles.product}>
        <AppText variant="cardTitle" numberOfLines={2}>{product.name}</AppText>
        <AppText variant="caption" tone="secondary">{Math.round(product.servingSizeG)} г · {Math.round(product.calories)} ккал</AppText>
        <AppText variant="caption" tone="green">Выбрать</AppText>
      </GlassCard>)}</View>
      {error ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="warning">{error}</AppText> : null}
    </OnboardingShell>
    <AddToDiarySheet product={selected} visible={Boolean(selected)} initialMeal={defaultMeal} onClose={() => setSelected(null)} onAdd={add} />
  </>;
}

const styles = StyleSheet.create({
  actions: { gap: spacing.xs }, search: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md }, searchInput: { flex: 1, minHeight: 50, fontSize: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, product: { width: '47%', flexGrow: 1, minHeight: 126 }, successRhythm: { minHeight: 190, alignItems: 'center', justifyContent: 'center' },
});
