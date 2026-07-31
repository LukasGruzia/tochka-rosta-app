import { calculateForWeight, calculateRecipe, validateRecipeDraft } from '@/services/foodMath';
import type { RecipeDraft } from '@/types/domain';
import { getDatabase } from '../database';
import { getProductById } from './productRepository';

export async function saveRecipe(draft: RecipeDraft) {
  const errors = validateRecipeDraft(draft);
  if (errors.length) throw new Error(errors[0]);
  const calculation = calculateRecipe(draft.ingredients, draft.finalWeightG, draft.servings);
  const db = await getDatabase();
  const now = new Date().toISOString();
  let productId = 0;
  let recipeId = draft.id ?? 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    if (draft.id) {
      const existing = await txn.getFirstAsync<{ id: number; product_id: number }>('SELECT id, product_id FROM recipes WHERE id=? AND deleted_at IS NULL', draft.id);
      if (!existing) throw new Error('Рецепт не найден');
      productId = existing.product_id;
      recipeId = existing.id;
      await txn.runAsync(`UPDATE products SET name=?, description=?, serving_size_g=?, calories=?, protein_g=?, fat_g=?, carbs_g=?,
        calories_per_100g=?, protein_per_100g=?, fat_per_100g=?, carbs_per_100g=?, image_uri=?, category=?, updated_at=? WHERE id=?`,
        draft.name.trim(), draft.description.trim(), calculation.effectiveWeightG / draft.servings, calculation.perServing.calories,
        calculation.perServing.proteinG, calculation.perServing.fatG, calculation.perServing.carbsG, calculation.per100g.calories,
        calculation.per100g.proteinG, calculation.per100g.fatG, calculation.per100g.carbsG, draft.imageUri, draft.category, now, productId);
      await txn.runAsync(`UPDATE recipes SET name=?, description=?, category=?, image_uri=?, servings=?, final_weight_g=?,
        total_calories=?, total_protein_g=?, total_fat_g=?, total_carbs_g=?, updated_at=? WHERE id=?`, draft.name.trim(),
        draft.description.trim(), draft.category, draft.imageUri, draft.servings, calculation.effectiveWeightG,
        calculation.totals.calories, calculation.totals.proteinG, calculation.totals.fatG, calculation.totals.carbsG, now, draft.id);
      await txn.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id=?', draft.id);
    } else {
      const slug = `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const productResult = await txn.runAsync(`INSERT INTO products (
        slug, name, description, serving_size_g, calories, protein_g, fat_g, carbs_g, price, image_key, image_uri,
        category, is_available, data_status, source_type, source_id, source_name, locale, is_user_created,
        calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, meal_tags, goal_tags, diet_tags, allergens,
        aliases, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '', ?, ?, 1, 'custom', 'user_recipe', ?, 'Пользователь', 'ru', 1,
        ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', ?, ?)`, slug, draft.name.trim(), draft.description.trim(),
        calculation.effectiveWeightG / draft.servings, calculation.perServing.calories, calculation.perServing.proteinG,
        calculation.perServing.fatG, calculation.perServing.carbsG, draft.imageUri, draft.category, slug,
        calculation.per100g.calories, calculation.per100g.proteinG, calculation.per100g.fatG, calculation.per100g.carbsG, now, now);
      productId = Number(productResult.lastInsertRowId);
      const recipeResult = await txn.runAsync(`INSERT INTO recipes (product_id, name, description, category, image_uri, servings,
        final_weight_g, total_calories, total_protein_g, total_fat_g, total_carbs_g, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, productId, draft.name.trim(), draft.description.trim(), draft.category,
        draft.imageUri, draft.servings, calculation.effectiveWeightG, calculation.totals.calories, calculation.totals.proteinG,
        calculation.totals.fatG, calculation.totals.carbsG, now, now);
      recipeId = Number(recipeResult.lastInsertRowId);
    }
    for (const ingredient of draft.ingredients) {
      const values = calculateForWeight(ingredient.product, ingredient.amountG);
      await txn.runAsync(`INSERT INTO recipe_ingredients (recipe_id, product_id, source_type, product_name_snapshot, amount_g,
        calories, protein_g, fat_g, carbs_g, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, recipeId,
        ingredient.product.id, ingredient.product.sourceType, ingredient.product.name, ingredient.amountG, values.calories,
        values.proteinG, values.fatG, values.carbsG, now);
    }
  });
  return getProductById(productId);
}

export async function loadRecipe(productId: number): Promise<RecipeDraft | null> {
  const db = await getDatabase();
  const recipe = await db.getFirstAsync<{ id: number; name: string; description: string; category: string; image_uri: string | null; servings: number; final_weight_g: number }>(
    'SELECT id, name, description, category, image_uri, servings, final_weight_g FROM recipes WHERE product_id=? AND deleted_at IS NULL', productId);
  if (!recipe) return null;
  const rows = await db.getAllAsync<{ product_id: number; amount_g: number }>('SELECT product_id, amount_g FROM recipe_ingredients WHERE recipe_id=? ORDER BY id', recipe.id);
  const ingredients = (await Promise.all(rows.map(async (row) => {
    const product = await getProductById(row.product_id);
    return product ? { product, amountG: row.amount_g } : null;
  }))).filter((item): item is NonNullable<typeof item> => item != null);
  return { id: recipe.id, name: recipe.name, description: recipe.description, category: recipe.category, imageUri: recipe.image_uri, servings: recipe.servings, finalWeightG: recipe.final_weight_g, ingredients };
}
