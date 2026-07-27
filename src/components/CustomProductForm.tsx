import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppBackground } from './AppBackground';
import { AppText } from './AppText';
import { FilterChip } from './FilterChip';
import { FormField } from './FormField';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';
import { createCustomProduct, getProductById, updateCustomProduct } from '@/database/repositories/productRepository';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import type { NutritionBasis, ProductDraft } from '@/types/domain';

const empty: ProductDraft = { name: '', category: 'Мои продукты', basisType: 'per100g', basisAmount: 100, basisUnit: 'g', servingSizeG: 100, packageSizeG: null, calories: 0, proteinG: null, fatG: null, carbsG: null, allergens: [] };
const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value.replace(',', '.'));

export function CustomProductForm({ productId }: { productId?: number }) {
  const refreshProducts = useAppStore((state) => state.refreshProducts);
  const [draft, setDraft] = useState(empty);
  const [values, setValues] = useState({ basisAmount: '100', serving: '100', package: '', calories: '', protein: '', fat: '', carbs: '', fiber: '', sugar: '', sodium: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!productId) return; void getProductById(productId).then((product) => { if (!product) return; setDraft({ id: product.id, name: product.name, category: product.category, description: product.description, ingredients: product.ingredients ?? '', note: product.note ?? '', basisType: 'per100g', basisAmount: 100, basisUnit: 'g', servingSizeG: product.servingSizeG, packageSizeG: product.packageSizeG, calories: product.caloriesPer100g, proteinG: product.proteinPer100g, fatG: product.fatPer100g, carbsG: product.carbsPer100g, fiberG: product.fiberPer100g, sugarG: product.sugarPer100g, sodiumMg: product.sodiumPer100g, allergens: product.allergens, barcode: product.barcode, imageUri: product.imageUri }); setValues({ basisAmount: '100', serving: String(product.servingSizeG), package: product.packageSizeG ? String(product.packageSizeG) : '', calories: String(product.caloriesPer100g), protein: product.proteinPer100g == null ? '' : String(product.proteinPer100g), fat: product.fatPer100g == null ? '' : String(product.fatPer100g), carbs: product.carbsPer100g == null ? '' : String(product.carbsPer100g), fiber: product.fiberPer100g == null ? '' : String(product.fiberPer100g), sugar: product.sugarPer100g == null ? '' : String(product.sugarPer100g), sodium: product.sodiumPer100g == null ? '' : String(product.sodiumPer100g) }); }); }, [productId]);
  const updateValue = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const pickImage = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 }); if (!result.canceled) setDraft((current) => ({ ...current, imageUri: result.assets[0].uri })); };
  const submit = async () => {
    const normalized: ProductDraft = { ...draft, basisAmount: Number(values.basisAmount.replace(',', '.')), servingSizeG: Number(values.serving.replace(',', '.')), packageSizeG: numberOrNull(values.package), calories: Number(values.calories.replace(',', '.')), proteinG: numberOrNull(values.protein), fatG: numberOrNull(values.fat), carbsG: numberOrNull(values.carbs), fiberG: numberOrNull(values.fiber), sugarG: numberOrNull(values.sugar), sodiumMg: numberOrNull(values.sodium) };
    if (!normalized.name.trim()) return Alert.alert('Добавь название');
    if (!Number.isFinite(normalized.calories) || normalized.calories < 0) return Alert.alert('Проверь калорийность');
    try { setSaving(true); const product = productId ? await updateCustomProduct(productId, normalized) : await createCustomProduct(normalized); await refreshProducts(); if (product) router.replace(`/product/${product.id}` as never); }
    catch (error) { Alert.alert('Не удалось сохранить', error instanceof Error ? error.message : 'Проверь поля'); } finally { setSaving(false); }
  };
  return <AppBackground><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <View style={styles.header}><View style={styles.headerCopy}><AppText variant="title">{productId ? 'Редактировать продукт' : 'Новый продукт'}</AppText><AppText tone="secondary">Пищевая ценность останется только на этом устройстве.</AppText></View></View>
    <GlassCard style={styles.form}><FormField label="Название *" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Например, домашняя гранола"/><FormField label="Категория" value={draft.category} onChangeText={(category) => setDraft({ ...draft, category })}/><FormField label="Описание" value={draft.description ?? ''} onChangeText={(description) => setDraft({ ...draft, description })} multiline/><FormField label="Состав" value={draft.ingredients ?? ''} onChangeText={(ingredients) => setDraft({ ...draft, ingredients })} multiline/><FormField label="Аллергены" value={draft.allergens.join(', ')} onChangeText={(value) => setDraft({ ...draft, allergens: value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Например: молоко, орехи"/><FormField label="Заметка" value={draft.note ?? ''} onChangeText={(note) => setDraft({ ...draft, note })} multiline/></GlassCard>
    <GlassCard style={styles.form}><AppText variant="heading">Основа расчёта</AppText><View style={styles.chips}>{([['per100g', 'На 100 г'], ['serving', 'На порцию'], ['package', 'На упаковку']] as [NutritionBasis, string][]).map(([basis, label]) => <FilterChip key={basis} label={label} selected={draft.basisType === basis} onPress={() => { setDraft({ ...draft, basisType: basis }); if (basis === 'per100g') setValues((current) => ({ ...current, basisAmount: '100' })); }}/>)}</View><FormField label="Количество для указанных КБЖУ" value={values.basisAmount} onChangeText={updateValue('basisAmount')} keyboardType="decimal-pad" suffix="г"/><FormField label="Обычная порция" value={values.serving} onChangeText={updateValue('serving')} keyboardType="decimal-pad" suffix="г"/><FormField label="Вес упаковки" value={values.package} onChangeText={updateValue('package')} keyboardType="decimal-pad" suffix="г (необязательно)"/></GlassCard>
    <GlassCard style={styles.form}><AppText variant="heading">Пищевая ценность</AppText><FormField label="Калории *" value={values.calories} onChangeText={updateValue('calories')} keyboardType="decimal-pad" suffix="ккал"/><View style={styles.columns}><View style={styles.column}><FormField label="Белки" value={values.protein} onChangeText={updateValue('protein')} keyboardType="decimal-pad" suffix="г"/></View><View style={styles.column}><FormField label="Жиры" value={values.fat} onChangeText={updateValue('fat')} keyboardType="decimal-pad" suffix="г"/></View></View><FormField label="Углеводы" value={values.carbs} onChangeText={updateValue('carbs')} keyboardType="decimal-pad" suffix="г"/><FormField label="Клетчатка" value={values.fiber} onChangeText={updateValue('fiber')} keyboardType="decimal-pad" suffix="г"/><FormField label="Сахар" value={values.sugar} onChangeText={updateValue('sugar')} keyboardType="decimal-pad" suffix="г"/><FormField label="Натрий" value={values.sodium} onChangeText={updateValue('sodium')} keyboardType="decimal-pad" suffix="мг"/><AppText variant="caption" tone="muted">Белки, жиры и углеводы можно оставить пустыми — приложение покажет «—», а не подставит ноль.</AppText></GlassCard>
    <GlassCard style={styles.form}>{draft.imageUri ? <Image source={{ uri: draft.imageUri }} contentFit="cover" style={styles.photo}/> : null}<PrimaryButton label={draft.imageUri ? 'Заменить фотографию' : 'Выбрать фотографию'} secondary onPress={pickImage}/><FormField label="Штрихкод / QR" value={draft.barcode ?? ''} onChangeText={(barcode) => setDraft({ ...draft, barcode })} placeholder="Необязательно"/></GlassCard>
    <PrimaryButton label={saving ? 'Сохраняем…' : 'Сохранить продукт'} disabled={saving} onPress={submit}/><PrimaryButton label="Отмена" secondary onPress={() => router.back()}/>
  </ScrollView></AppBackground>;
}

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingTop: 64, paddingBottom: 60, gap: spacing.md }, header: { flexDirection: 'row' }, headerCopy: { flex: 1, gap: spacing.xs }, form: { gap: spacing.md }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, columns: { flexDirection: 'row', gap: spacing.sm }, column: { flex: 1 }, photo: { width: '100%', aspectRatio: 1.6, borderRadius: radii.md }, });
