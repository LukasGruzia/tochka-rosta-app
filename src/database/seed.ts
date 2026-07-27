import type { SQLiteDatabase } from 'expo-sqlite';

const demoProducts = [
  ['khinkali-pp', 'Хинкали ПП', 'Сочное мясо и тонкое тесто', 'Мука, говядина, зелень, специи', 280, 420, 28, 14, 46, 390, 'khinkali', 'Основные блюда', ['lunch', 'dinner'], ['gain'], ['meat'], ['glutenFree'], 'TR-KHINKALI'],
  ['caesar', 'Салат Цезарь', 'Курица, салат и лёгкий соус', 'Курица, салат, сыр, сухарики, соус', 250, 310, 27, 15, 17, 420, 'caesar', 'Салаты', ['lunch', 'dinner'], ['balance', 'loss'], ['meat'], ['lactoseFree', 'glutenFree'], 'TR-CAESAR'],
  ['protein-shake', 'Протеиновый коктейль', 'Белковый напиток с мягким вкусом', 'Молочный белок, банан, какао', 350, 230, 31, 5, 16, 290, 'protein-shake', 'Напитки', ['breakfast', 'snack'], ['gain', 'balance'], [], ['lactoseFree'], 'TR-PROTEIN'],
  ['brownie-sugar-free', 'Брауни без сахара', 'Насыщенный шоколадный десерт', 'Какао, мука, яйцо, подсластитель', 110, 260, 9, 17, 23, 250, 'brownie', 'Десерты', ['snack'], ['balance'], ['vegetarian'], ['glutenFree'], 'TR-BROWNIE'],
  ['syrniki', 'Сырники', 'Нежный творожный завтрак', 'Творог, яйцо, рисовая мука', 220, 360, 24, 14, 35, 340, 'syrniki', 'Завтраки', ['breakfast', 'snack'], ['gain', 'balance'], ['vegetarian'], ['lactoseFree'], 'TR-SYRNIKI'],
  ['chicken-rice-bowl', 'Боул с курицей и рисом', 'Сбалансированный боул с овощами', 'Курица, рис, овощи, соус', 360, 510, 38, 16, 55, 470, 'chicken-rice-bowl', 'Основные блюда', ['lunch', 'dinner'], ['gain', 'balance'], ['meat'], [], 'TR-CHICKEN'],
] as const;

export async function seedDatabase(db: SQLiteDatabase) {
  const statement = await db.prepareAsync(`INSERT OR IGNORE INTO products (
    slug, name, description, ingredients, serving_size_g, calories, protein_g, fat_g, carbs_g, price, image_key,
    category, meal_tags, goal_tags, diet_tags, allergens, qr_code, is_available, data_status, source_type,
    source_id, source_name, locale, is_user_created, calories_per_100g, protein_per_100g, fat_per_100g,
    carbs_per_100g, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'demo', 'tochka_rosta', ?, 'Точка Роста', 'ru', 0,
    ? * 100.0 / ?, ? * 100.0 / ?, ? * 100.0 / ?, ? * 100.0 / ?, ?, ?)`);
  const now = new Date().toISOString();
  try {
    for (const product of demoProducts) {
      const [slug, name, description, ingredients, servingSize, calories, protein, fat, carbs, price, imageKey, category, mealTags, goalTags, dietTags, allergens, qrCode] = product;
      await statement.executeAsync(slug, name, description, ingredients, servingSize, calories, protein, fat, carbs, price,
        imageKey, category, JSON.stringify(mealTags), JSON.stringify(goalTags), JSON.stringify(dietTags),
        JSON.stringify(allergens), qrCode, slug, calories, servingSize, protein, servingSize, fat, servingSize, carbs,
        servingSize, now, now);
    }
  } finally {
    await statement.finalizeAsync();
  }
  await db.runAsync(`INSERT OR IGNORE INTO flow_state (id, current_streak, longest_streak, updated_at) VALUES (1, 0, 0, ?)`, now);
}
