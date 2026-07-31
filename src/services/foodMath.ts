import type { Product, ProductDraft, RecipeIngredientDraft } from '@/types/domain';

export interface MacroValues {
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
}

function scaleNullable(value: number | null | undefined, factor: number) {
  return value == null ? null : value * factor;
}

export function roundValue(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeTo100g(draft: ProductDraft): MacroValues & {
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
} {
  const basisWeight = draft.basisType === 'per100g'
    ? 100
    : draft.basisType === 'package'
      ? draft.packageSizeG ?? 0
      : draft.servingSizeG;
  if (!Number.isFinite(basisWeight) || basisWeight <= 0) throw new Error('Вес основы должен быть больше нуля');
  const factor = 100 / basisWeight;
  return {
    calories: roundValue(draft.calories * factor),
    proteinG: scaleNullable(draft.proteinG, factor) == null ? null : roundValue(scaleNullable(draft.proteinG, factor)!),
    fatG: scaleNullable(draft.fatG, factor) == null ? null : roundValue(scaleNullable(draft.fatG, factor)!),
    carbsG: scaleNullable(draft.carbsG, factor) == null ? null : roundValue(scaleNullable(draft.carbsG, factor)!),
    fiberG: scaleNullable(draft.fiberG, factor) == null ? null : roundValue(scaleNullable(draft.fiberG, factor)!),
    sugarG: scaleNullable(draft.sugarG, factor) == null ? null : roundValue(scaleNullable(draft.sugarG, factor)!),
    sodiumMg: scaleNullable(draft.sodiumMg, factor) == null ? null : roundValue(scaleNullable(draft.sodiumMg, factor)!),
  };
}

export function calculateForWeight(product: Product, weightG: number): MacroValues {
  const safeWeight = Math.max(0, weightG);
  const factor = safeWeight / 100;
  return {
    calories: roundValue(product.caloriesPer100g * factor),
    proteinG: scaleNullable(product.proteinPer100g, factor) == null ? null : roundValue(scaleNullable(product.proteinPer100g, factor)!),
    fatG: scaleNullable(product.fatPer100g, factor) == null ? null : roundValue(scaleNullable(product.fatPer100g, factor)!),
    carbsG: scaleNullable(product.carbsPer100g, factor) == null ? null : roundValue(scaleNullable(product.carbsPer100g, factor)!),
  };
}

export function calculateForServings(product: Product, servings: number) {
  return calculateForWeight(product, product.servingSizeG * servings);
}

export function estimatedCaloriesFromMacros(values: Pick<MacroValues, 'proteinG' | 'fatG' | 'carbsG'>) {
  if (values.proteinG == null || values.fatG == null || values.carbsG == null) return null;
  return values.proteinG * 4 + values.carbsG * 4 + values.fatG * 9;
}

export function hasCalorieMismatch(values: MacroValues) {
  const estimated = estimatedCaloriesFromMacros(values);
  if (estimated == null || values.calories <= 0) return false;
  const difference = Math.abs(values.calories - estimated);
  return difference >= 30 && difference / values.calories >= 0.2;
}

export function validateProductDraft(draft: ProductDraft) {
  const errors: string[] = [];
  if (draft.name.trim().length < 2) errors.push('Укажи название продукта');
  if (!Number.isFinite(draft.calories) || draft.calories < 0 || draft.calories > 1500) errors.push('Проверь калорийность');
  if (!Number.isFinite(draft.servingSizeG) || draft.servingSizeG <= 0 || draft.servingSizeG > 5000) errors.push('Проверь вес порции');
  if (draft.basisType === 'package' && (!draft.packageSizeG || draft.packageSizeG <= 0)) errors.push('Укажи вес упаковки');
  for (const [label, value] of [['Белки', draft.proteinG], ['Жиры', draft.fatG], ['Углеводы', draft.carbsG]] as const) {
    if (value != null && (!Number.isFinite(value) || value < 0)) errors.push(`${label}: значение не может быть отрицательным`);
  }
  const normalized = errors.length ? null : normalizeTo100g(draft);
  if (normalized && [normalized.proteinG, normalized.fatG, normalized.carbsG].some((value) => value != null && value > 100)) {
    errors.push('Один из показателей БЖУ превышает 100 г на 100 г продукта');
  }
  return errors;
}

export function calculateRecipe(ingredients: RecipeIngredientDraft[], finalWeightG: number | null, servings: number) {
  const totalWeightG = ingredients.reduce((sum, item) => sum + item.amountG, 0);
  const effectiveWeightG = finalWeightG && finalWeightG > 0 ? finalWeightG : totalWeightG;
  if (effectiveWeightG <= 0 || servings <= 0) throw new Error('Добавь ингредиенты и укажи количество порций');
  const totals = ingredients.reduce<MacroValues>((sum, ingredient) => {
    const values = calculateForWeight(ingredient.product, ingredient.amountG);
    return {
      calories: sum.calories + values.calories,
      proteinG: sum.proteinG == null || values.proteinG == null ? null : sum.proteinG + values.proteinG,
      fatG: sum.fatG == null || values.fatG == null ? null : sum.fatG + values.fatG,
      carbsG: sum.carbsG == null || values.carbsG == null ? null : sum.carbsG + values.carbsG,
    };
  }, { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 });
  const per100gFactor = 100 / effectiveWeightG;
  const perServingFactor = 1 / servings;
  const scale = (factor: number): MacroValues => ({
    calories: roundValue(totals.calories * factor),
    proteinG: totals.proteinG == null ? null : roundValue(totals.proteinG * factor),
    fatG: totals.fatG == null ? null : roundValue(totals.fatG * factor),
    carbsG: totals.carbsG == null ? null : roundValue(totals.carbsG * factor),
  });
  return {
    totalWeightG,
    effectiveWeightG,
    isApproximateWeight: !finalWeightG,
    totals: scale(1),
    per100g: scale(per100gFactor),
    perServing: scale(perServingFactor),
  };
}

export function validateRecipeDraft(draft: Pick<import('@/types/domain').RecipeDraft, 'name' | 'ingredients' | 'finalWeightG' | 'servings'>) {
  const errors: string[] = [];
  if (draft.name.trim().length < 2) errors.push('Укажи название рецепта');
  if (!Number.isFinite(draft.servings) || draft.servings <= 0 || draft.servings > 100) errors.push('Проверь количество порций');
  if (draft.finalWeightG != null && (!Number.isFinite(draft.finalWeightG) || draft.finalWeightG <= 0 || draft.finalWeightG > 50000)) errors.push('Проверь вес готового блюда');
  if (!draft.ingredients.length) errors.push('Добавь хотя бы один ингредиент');
  if (draft.ingredients.some((item) => !Number.isFinite(item.amountG) || item.amountG <= 0 || item.amountG > 10000)) errors.push('Проверь вес ингредиентов');
  return errors;
}
