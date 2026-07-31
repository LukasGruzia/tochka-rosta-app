import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { productAssets } from '@/constants/productAssets';
import { cloneCustomProduct, deleteCustomProduct, getProductById, restoreCustomProduct } from '@/database/repositories/productRepository';
import { calculateForWeight } from '@/services/foodMath';
import { formatProductUpdatedAt, getProductSourceLabel } from '@/services/productPresentation';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { Product } from '@/types/domain';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const insets = useSafeAreaInsets(); const { colors } = useTheme();
  const addToDiary = useAppStore((state) => state.addToDiary); const diaryDate = useAppStore((state) => state.diaryDate); const refreshProducts = useAppStore((state) => state.refreshProducts); const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [product, setProduct] = useState<Product | null>(null); const [loaded, setLoaded] = useState(false); const [loadError, setLoadError] = useState<string | null>(null); const [sheet, setSheet] = useState(false); const [basis, setBasis] = useState<'100' | 'serving'>('100');
  useEffect(() => {
    const productId = Number(id);
    if (!id || id === 'new' || !Number.isInteger(productId) || productId <= 0) { setLoaded(true); setProduct(null); return; }
    setLoaded(false); setLoadError(null);
    void getProductById(productId).then(setProduct).catch((error) => setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить продукт')).finally(() => setLoaded(true));
  }, [id]);
  const weight = basis === '100' ? 100 : product?.servingSizeG ?? 100; const values = useMemo(() => product ? calculateForWeight(product, weight) : null, [product, weight]);
  if (!loaded) return <AppBackground><SafeAreaView style={styles.loading}><AppText tone="secondary">Загружаем продукт…</AppText></SafeAreaView></AppBackground>;
  if (!product) return <AppBackground><SafeAreaView style={styles.loading}><AppText variant="heading">Продукт не найден или был удалён.</AppText>{loadError ? <AppText tone="secondary">{loadError}</AppText> : null}<PrimaryButton label="Вернуться назад" onPress={() => router.back()} /></SafeAreaView></AppBackground>;
  const imageSource = product.imageUri ? { uri: product.imageUri } : productAssets[product.imageKey];
  const status = getProductSourceLabel(product);
  const remove = () => Alert.alert('Удалить продукт?', 'Записи в дневнике сохранят снимок названия и КБЖУ.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: async () => { await deleteCustomProduct(product.id); await refreshProducts(); router.back(); Alert.alert('Продукт удалён', 'Старые записи дневника сохранены.', [{ text: 'Вернуть', onPress: () => { void restoreCustomProduct(product.id).then(refreshProducts); } }, { text: 'Готово' }]); } }]);

  return <>
    <AppBackground><SafeAreaView style={styles.safe} edges={['top']}><View style={styles.topBar}><Pressable accessibilityLabel="Назад" onPress={() => router.back()} style={[styles.circle, { backgroundColor: colors.surfaceStrong }]}><AppText>‹</AppText></Pressable><AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.topTitle}>{product.category}</AppText><Pressable accessibilityLabel={product.isFavorite ? 'Убрать из избранного' : 'В избранное'} onPress={async () => { await toggleFavorite(product.id); setProduct({ ...product, isFavorite: !product.isFavorite }); }} style={[styles.circle, { backgroundColor: colors.surfaceStrong }]}><AppText tone={product.isFavorite ? 'green' : 'secondary'}>{product.isFavorite ? '♥' : '♡'}</AppText></Pressable></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 94 + Math.max(insets.bottom, 8) }]}>
        {imageSource ? <Image source={imageSource} contentFit="cover" style={styles.hero} transition={180} /> : <View style={[styles.hero, styles.placeholder, { backgroundColor: colors.greenDark }]}><AppText variant="display" tone="green">{product.name.slice(0, 1)}</AppText></View>}
        <View style={styles.titleBlock}><View style={[styles.status, { backgroundColor: colors.greenGlow }]}><AppText variant="caption" tone="green">{status}</AppText></View><AppText variant="title">{product.name}</AppText><AppText tone="secondary">{product.originalName && product.originalName !== product.name ? product.originalName : product.sourceName}</AppText></View>
        <View style={styles.chips}><FilterChip label="На 100 г" selected={basis === '100'} onPress={() => setBasis('100')} /><FilterChip label={`Порция ${Math.round(product.servingSizeG)} г`} selected={basis === 'serving'} onPress={() => setBasis('serving')} /></View>
        <GlassCard variant="accent"><View style={styles.calories}><AppText variant="display" tone="green">{Math.round(values?.calories ?? 0)}</AppText><AppText tone="secondary">ккал · {Math.round(weight)} г</AppText></View><View style={styles.macros}><Macro label="Белки" value={values?.proteinG} /><Macro label="Жиры" value={values?.fatG} /><Macro label="Углеводы" value={values?.carbsG} /></View></GlassCard>
        <GlassCard variant="compact"><AppText variant="heading">О продукте</AppText><AppText tone="secondary">{product.description || 'Описание пока не добавлено.'}</AppText>{product.ingredients ? <><AppText style={styles.sectionTitle}>Состав</AppText><AppText tone="secondary">{product.ingredients}</AppText></> : null}{product.note ? <><AppText style={styles.sectionTitle}>Заметка</AppText><AppText tone="secondary">{product.note}</AppText></> : null}</GlassCard>
        <GlassCard variant="compact"><AppText variant="heading">Дополнительно · на 100 г</AppText><Info label="Клетчатка" value={product.fiberPer100g} unit="г" /><Info label="Сахара" value={product.sugarPer100g} unit="г" /><Info label="Натрий" value={product.sodiumPer100g} unit="мг" /><Info label="Аллергены" text={product.allergens.length ? product.allergens.join(', ') : 'Не указаны'} /></GlassCard>
        <GlassCard variant="compact"><AppText variant="heading">Источник данных</AppText><AppText tone="green">{status}</AppText><AppText tone="secondary">{product.sourceName}{product.sourceVersion ? ` · ${product.sourceVersion}` : ''}</AppText><AppText variant="caption" tone="muted">{formatProductUpdatedAt(product.updatedAt)}</AppText><AppText variant="caption" tone="muted">Пищевая ценность справочная и может отличаться у конкретной партии. Для упакованного продукта сверяйся с этикеткой.</AppText></GlassCard>
        {product.isUserCreated ? <GlassCard variant="compact"><AppText variant="heading">Мой продукт</AppText><PrimaryButton label="Редактировать" secondary onPress={() => router.push((product.sourceType === 'user_recipe' ? `/recipe/edit/${product.id}` : `/product/edit/${product.id}`) as never)} />{product.sourceType === 'user_product' ? <PrimaryButton label="Создать копию" secondary onPress={async () => { const clone = await cloneCustomProduct(product.id); await refreshProducts(); if (clone) router.replace(`/product/${clone.id}` as never); }} /> : null}<PrimaryButton label="Удалить" secondary onPress={remove} /></GlassCard> : null}
      </ScrollView>
      <View style={[styles.sticky, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]}><View style={styles.stickyCopy}><AppText style={styles.bold}>{Math.round(product.calories * 100 / product.servingSizeG)} ккал</AppText><AppText variant="caption" tone="muted">на 100 г</AppText></View><View style={styles.stickyButton}><PrimaryButton label="Добавить" onPress={() => setSheet(true)} /></View></View>
    </SafeAreaView></AppBackground>
    <AddToDiarySheet product={product} visible={sheet} date={diaryDate} onClose={() => setSheet(false)} onAdd={(mealType, servings, quantityG) => addToDiary({ product, mealType, servings, quantityG })} />
  </>;
}

function Macro({ label, value }: { label: string; value: number | null | undefined }) { return <View style={styles.macro}><AppText variant="heading">{value == null ? '—' : value.toFixed(1)}</AppText><AppText variant="caption" tone="secondary">{label} · г</AppText></View>; }
function Info({ label, value, unit, text }: { label: string; value?: number | null; unit?: string; text?: string }) { return <View style={styles.info}><AppText tone="secondary">{label}</AppText><AppText>{text ?? (value == null ? '—' : `${value.toFixed(1)} ${unit}`)}</AppText></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg }, topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm }, circle: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, topTitle: { flex: 1, textAlign: 'center' },
  content: { paddingHorizontal: spacing.md, gap: spacing.md }, hero: { width: '100%', aspectRatio: 1.45, borderRadius: radii.xl }, placeholder: { alignItems: 'center', justifyContent: 'center' }, titleBlock: { gap: spacing.xs }, status: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, chips: { flexDirection: 'row', gap: spacing.sm },
  calories: { alignItems: 'center', marginBottom: spacing.lg }, macros: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, macro: { flex: 1, alignItems: 'center', gap: spacing.xs }, sectionTitle: { marginTop: spacing.md, fontWeight: '700' }, info: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm }, stickyCopy: { minWidth: 86 }, stickyButton: { flex: 1 }, bold: { fontWeight: '800' },
});
