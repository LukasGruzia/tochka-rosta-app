import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddToDiarySheet } from '@/components/AddToDiarySheet';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { productAssets } from '@/constants/productAssets';
import { cloneCustomProduct, deleteCustomProduct, getProductById } from '@/database/repositories/productRepository';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Product } from '@/types/domain';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addToDiary = useAppStore((state) => state.addToDiary);
  const refreshProducts = useAppStore((state) => state.refreshProducts);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [product, setProduct] = useState<Product | null>(null);
  const [sheet, setSheet] = useState(false);
  useEffect(() => { if (id && id !== 'new') void getProductById(Number(id)).then(setProduct); }, [id]);
  if (!product) return <AppBackground><SafeAreaView style={styles.loading}><AppText tone="secondary">Загружаем продукт…</AppText></SafeAreaView></AppBackground>;
  const imageSource = product.imageUri ? { uri: product.imageUri } : productAssets[product.imageKey];
  const remove = () => Alert.alert('Удалить продукт?', 'Записи в дневнике сохранят снимок названия и КБЖУ.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: async () => { await deleteCustomProduct(product.id); await refreshProducts(); router.back(); } }]);
  return <>
    <TabScreen title={product.name} subtitle={`${product.sourceName} · ${product.dataStatus === 'verified' ? 'проверенные данные' : 'данные источника'}`} headerRight={<Pressable style={styles.close} onPress={() => router.back()}><AppText>×</AppText></Pressable>}>
      {imageSource ? <Image source={imageSource} contentFit="cover" style={styles.hero}/> : null}
      <GlassCard variant="accent"><View style={styles.calories}><AppText variant="title" tone="green">{Math.round(product.caloriesPer100g)}</AppText><AppText tone="secondary">ккал на 100 г</AppText></View><View style={styles.macros}>{[['Белки', product.proteinPer100g], ['Жиры', product.fatPer100g], ['Углеводы', product.carbsPer100g]].map(([label, value]) => <View key={String(label)} style={styles.macro}><AppText variant="heading">{value == null ? '—' : Number(value).toFixed(1)}</AppText><AppText variant="caption" tone="secondary">{label} · г</AppText></View>)}</View></GlassCard>
      <GlassCard variant="compact"><AppText variant="heading">О продукте</AppText><AppText tone="secondary">{product.description || 'Описание пока не добавлено.'}</AppText>{product.ingredients ? <><AppText style={styles.sectionTitle}>Состав</AppText><AppText tone="secondary">{product.ingredients}</AppText></> : null}<AppText variant="caption" tone="muted">Порция: {product.servingSizeG} г · Категория: {product.category}</AppText></GlassCard>
      <PrimaryButton label="Добавить в дневник" onPress={() => setSheet(true)}/>
      <PrimaryButton label={product.isFavorite ? 'Убрать из избранного' : 'В избранное'} secondary onPress={async () => { await toggleFavorite(product.id); setProduct({ ...product, isFavorite: !product.isFavorite }); }}/>
      {product.isUserCreated ? <View style={styles.userActions}><PrimaryButton label="Редактировать" secondary onPress={() => router.push((product.sourceType === 'user_recipe' ? `/recipe/edit/${product.id}` : `/product/edit/${product.id}`) as never)}/>{product.sourceType === 'user_product' ? <PrimaryButton label="Создать копию" secondary onPress={async () => { const clone = await cloneCustomProduct(product.id); await refreshProducts(); if (clone) router.replace(`/product/${clone.id}` as never); }}/> : null}<PrimaryButton label="Удалить" secondary onPress={remove}/></View> : null}
      <AppText variant="caption" tone="muted">Источник: {product.sourceName}{product.sourceVersion ? ` · ${product.sourceVersion}` : ''}. Пищевая ценность может отличаться у конкретной партии продукта.</AppText>
    </TabScreen>
    <AddToDiarySheet product={product} visible={sheet} onClose={() => setSheet(false)} onAdd={(mealType, servings, quantityG) => addToDiary({ product, mealType, servings, quantityG })}/>
  </>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, hero: { width: '100%', aspectRatio: 1.55, borderRadius: radii.lg }, calories: { alignItems: 'center', marginBottom: spacing.lg }, macros: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, macro: { flex: 1, alignItems: 'center', gap: spacing.xs }, sectionTitle: { marginTop: spacing.md, fontWeight: '700' }, userActions: { gap: spacing.sm } });
