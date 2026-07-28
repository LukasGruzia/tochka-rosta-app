import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/domain';
import { deleteMealTemplate, loadMealTemplates, saveMealTemplate } from './mealTemplateRepository';

type Template = { id: number; name: string; default_meal_type: string; created_at: string; updated_at: string };
type Item = { id: number; template_id: number; product_id: number; meal_type: string; servings: number; quantity_g: number };
const state = vi.hoisted(() => ({ templates: [] as Template[], items: [] as Item[], nextTemplate: 1, nextItem: 1 }));
const db = vi.hoisted(() => ({
  getAllAsync: vi.fn(async (sql: string, id?: number) => sql.includes('meal_template_items') ? state.items.filter((item) => item.template_id === id) : state.templates),
  runAsync: vi.fn(async (sql: string, ...args: unknown[]) => {
    if (sql.startsWith('INSERT INTO meal_templates')) { const [name, meal, created, updated] = args as [string, string, string, string]; const id = state.nextTemplate++; state.templates.push({ id, name, default_meal_type: meal, created_at: created, updated_at: updated }); return { lastInsertRowId: id }; }
    if (sql.startsWith('DELETE FROM meal_template_items')) state.items = state.items.filter((item) => item.template_id !== args[0]);
    else if (sql.startsWith('DELETE FROM meal_templates')) state.templates = state.templates.filter((item) => item.id !== args[0]);
    else if (sql.startsWith('INSERT INTO meal_template_items')) { const [templateId, productId, , meal, servings, quantity] = args as [number, number, string, string, number, number]; state.items.push({ id: state.nextItem++, template_id: templateId, product_id: productId, meal_type: meal, servings, quantity_g: quantity }); }
    return {};
  }),
  withExclusiveTransactionAsync: vi.fn(async (callback: (txn: typeof db) => Promise<void>) => callback(db)),
}));
vi.mock('../database', () => ({ getDatabase: async () => db }));
vi.mock('./productRepository', () => ({ getProductById: async (id: number) => ({ id, name: 'Овсянка', caloriesPer100g: 100 } as Product) }));
describe('meal template CRUD', () => {
  beforeEach(() => { state.templates = []; state.items = []; state.nextTemplate = 1; state.nextItem = 1; vi.clearAllMocks(); });
  it('saves, loads and deletes a reusable meal', async () => { const product = { id: 5, name: 'Овсянка' } as Product; const id = await saveMealTemplate({ name: 'Мой завтрак', defaultMealType: 'breakfast', items: [{ product, mealType: 'breakfast', servings: 1, quantityG: 150 }] }); expect((await loadMealTemplates())[0]).toMatchObject({ id, name: 'Мой завтрак', items: [{ quantityG: 150 }] }); await deleteMealTemplate(id); expect(await loadMealTemplates()).toHaveLength(0); });
});
