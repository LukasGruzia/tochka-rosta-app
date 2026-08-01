import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { FilterChip } from './FilterChip';
import { PrimaryButton } from './PrimaryButton';
import { calculateForWeight } from '@/services/foodMath';
import { chooseInitialServing, loadProductServingOptions, loadProductServingPreference, recordProductServingPreference } from '@/database/repositories/servingRepository';
import { getNextMealType } from '@/services/diaryMath';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { MealType, Product, ServingOption, UserProductServingPreference } from '@/types/domain';

const meals: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак' }, { value: 'lunch', label: 'Обед' },
  { value: 'snack', label: 'Перекус' }, { value: 'dinner', label: 'Ужин' },
];

export function AddToDiarySheet({ product, visible, initialMeal = getNextMealType(), date, onClose, onAdd }: {
  product: Product | null; visible: boolean; initialMeal?: MealType; date?: string; onClose: () => void;
  onAdd: (meal: MealType, servings: number, quantityG: number) => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [quantity, setQuantity] = useState('100');
  const [saving, setSaving] = useState(false);
  const [servingOptions,setServingOptions]=useState<ServingOption[]>([]);
  const [preference,setPreference]=useState<UserProductServingPreference|null>(null);
  useEffect(() => {
    if(!product||!visible)return;
    let cancelled=false;setMeal(initialMeal);setQuantity(String(Math.round(product.servingSizeG>0?product.servingSizeG:100)));
    void Promise.all([loadProductServingOptions(product.id),loadProductServingPreference(product.id)]).then(([options,last])=>{if(cancelled)return;setServingOptions(options);setPreference(last);setQuantity(String(Math.round(chooseInitialServing(options,last,product.servingSizeG))));});
    return()=>{cancelled=true;};
  }, [initialMeal, product, visible]);
  const grams = Math.max(1, Number(quantity.replace(',', '.')) || 0);
  const values = useMemo(() => product ? calculateForWeight(product, grams) : null, [grams, product]);
  if (!product) return null;
  const submit = async () => { try { setSaving(true); await onAdd(meal, grams / product.servingSizeG, grams); await recordProductServingPreference(product.id,grams).catch((error)=>{if(__DEV__)console.warn('[ServingPreference] save failed',error);}); onClose(); } finally { setSaving(false); } };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={onClose} />
    <View style={[styles.sheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong }]}>
      <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View><AppText variant="heading">{product.name}</AppText><AppText tone="secondary">Выбери приём пищи и количество{date ? ` · ${date}` : ''}</AppText></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{meals.map((item) => <FilterChip key={item.value} label={item.label} selected={meal === item.value} onPress={() => setMeal(item.value)} />)}</ScrollView>
        <View style={styles.amountHeader}><AppText variant="heading">Количество</AppText>{preference?<AppText variant="caption" tone="green">Последний раз: {Math.round(preference.lastGramsEquivalent)} г</AppText>:null}</View>
        {servingOptions.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{servingOptions.slice(0,6).map(option=><FilterChip key={option.id} label={option.unit==='g'||option.unit==='ml'?option.label:`${option.label} · ${Math.round(option.gramsEquivalent)} г`} selected={Math.abs(grams-option.gramsEquivalent)<.5} onPress={()=>setQuantity(String(Math.round(option.gramsEquivalent)))}/>)}</ScrollView>:null}
        <View style={styles.quantityRow}>
          <Pressable style={[styles.roundButton, { backgroundColor: colors.greenDark }]} onPress={() => setQuantity(String(Math.max(1, grams - 10)))}><AppText variant="heading">−</AppText></Pressable>
          <View style={styles.inputWrap}><TextInput accessibilityLabel="Количество в граммах" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" selectTextOnFocus style={[styles.input, { color: colors.textPrimary }]}/><AppText variant="caption" tone="secondary">граммов</AppText></View>
          <Pressable style={[styles.roundButton, { backgroundColor: colors.greenDark }]} onPress={() => setQuantity(String(grams + 10))}><AppText variant="heading">+</AppText></Pressable>
        </View>
        <View style={styles.summary}><AppText variant="heading" tone="green">{Math.round(values?.calories ?? 0)} ккал</AppText><AppText tone="secondary">Б {values?.proteinG == null ? '—' : values.proteinG.toFixed(1)} · Ж {values?.fatG == null ? '—' : values.fatG.toFixed(1)} · У {values?.carbsG == null ? '—' : values.carbsG.toFixed(1)}</AppText></View>
        <PrimaryButton label={saving ? 'Добавляем…' : 'Добавить в дневник'} disabled={saving || grams <= 0} onPress={submit} />
        <PrimaryButton label="Отмена" secondary onPress={onClose} />
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject }, sheet: { maxHeight: '82%', position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: radii.pill, marginTop: spacing.sm }, content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg }, chips: { gap: spacing.sm },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }, roundButton: { width: 54, height: 54, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { alignItems: 'center' }, input: { minWidth: 110, padding: 0, fontSize: 34, fontWeight: '800', textAlign: 'center' }, summary: { alignItems: 'center', gap: spacing.xs },
  amountHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.sm},
});
