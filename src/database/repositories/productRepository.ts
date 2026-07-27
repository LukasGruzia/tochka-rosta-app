import type { Product } from '@/types/domain';
import { getDatabase } from '../database';

interface ProductRow {
  id: number; slug: string; name: string; description: string; serving_size_g: number; calories: number;
  protein_g: number; fat_g: number; carbs_g: number; price: number; image_key: string; category: string;
  is_available: number; data_status: Product['dataStatus'];
}

export async function loadProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ProductRow>('SELECT * FROM products WHERE is_available = 1 ORDER BY id');
  return rows.map((row) => ({
    id: row.id, slug: row.slug, name: row.name, description: row.description,
    servingSizeG: row.serving_size_g, calories: row.calories, proteinG: row.protein_g,
    fatG: row.fat_g, carbsG: row.carbs_g, price: row.price, imageKey: row.image_key,
    category: row.category, isAvailable: row.is_available === 1, dataStatus: row.data_status,
  }));
}
