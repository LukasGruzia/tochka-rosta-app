import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { FilterChip } from './FilterChip';
import { PrimaryButton } from './PrimaryButton';
import { calculateForWeight } from '@/services/foodMath';
import { colors, radii, spacing } from '@/theme/tokens';
import type { MealType, Product } from '@/types/domain';

const meals: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак' }, { value: 'lunch', label: 'Обед' },
  { value: 'snack', label: 'Перекус' }, { value: 'dinner', label: 'Ужин' },
];

export function AddToDiarySheet({ product, visible, initialMeal = 'snack', onClose, onAdd }: {
  product: Product | null; visible: boolean; initialMeal?: MealType; onClose: () => void;
  onAdd: (meal: MealType, servings: number, quantityG: number) => Promise<void>;
}) {
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [quantity, setQuantity] = useState('100');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (product && visible) { setMeal(initialMeal); setQuantity(String(Math.round(product.servingSizeG))); } }, [initialMeal, product, visible]);
  const grams = Math.max(1, Number(quantity.replace(',', '.')) || 0);
  const values = useMemo(() => product ? calculateForWeight(product, grams) : null, [grams, product]);
  if (!product) return null;
  const submit = async () => { try { setSaving(true); await onAdd(meal, grams / product.servingSizeG, grams); onClose(); } finally { setSaving(false); } };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.scrim} onPress={onClose} />
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View><AppText variant="heading">{product.name}</AppText><AppText tone="secondary">Выбери приём пищи и количество</AppText></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{meals.map((item) => <FilterChip key={item.value} label={item.label} selected={meal === item.value} onPress={() => setMeal(item.value)} />)}</ScrollView>
        <View style={styles.quantityRow}>
          <Pressable style={styles.roundButton} onPress={() => setQuantity(String(Math.max(1, grams - 10)))}><AppText variant="heading">−</AppText></Pressable>
          <View style={styles.inputWrap}><TextInput accessibilityLabel="Количество в граммах" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" selectTextOnFocus style={styles.input}/><AppText variant="caption" tone="secondary">граммов</AppText></View>
          <Pressable style={styles.roundButton} onPress={() => setQuantity(String(grams + 10))}><AppText variant="heading">+</AppText></Pressable>
        </View>
        <View style={styles.summary}><AppText variant="heading" tone="green">{Math.round(values?.calories ?? 0)} ккал</AppText><AppText tone="secondary">Б {values?.proteinG == null ? '—' : values.proteinG.toFixed(1)} · Ж {values?.fatG == null ? '—' : values.fatG.toFixed(1)} · У {values?.carbsG == null ? '—' : values.carbsG.toFixed(1)}</AppText></View>
        <PrimaryButton label={saving ? 'Добавляем…' : 'Добавить в дневник'} disabled={saving || grams <= 0} onPress={submit} />
        <PrimaryButton label="Отмена" secondary onPress={onClose} />
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.blackScrim }, sheet: { maxHeight: '82%', position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surfaceSolid, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1, borderColor: colors.glassBorderStrong },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: radii.pill, backgroundColor: colors.textMuted, marginTop: spacing.sm }, content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg }, chips: { gap: spacing.sm },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }, roundButton: { width: 54, height: 54, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenDark },
  inputWrap: { alignItems: 'center' }, input: { minWidth: 110, padding: 0, color: colors.textPrimary, fontSize: 34, fontWeight: '800', textAlign: 'center' }, summary: { alignItems: 'center', gap: spacing.xs },
});
