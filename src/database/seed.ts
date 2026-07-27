import type { SQLiteDatabase } from 'expo-sqlite';

const demoProducts = [
  ['khinkali-pp', 'Хинкали ПП', 'Сочное мясо и тонкое тесто', 280, 420, 28, 14, 46, 390, 'khinkali', 'Основное'],
  ['caesar', 'Салат Цезарь', 'Курица, салат и лёгкий соус', 250, 310, 27, 15, 17, 420, 'caesar', 'Салаты'],
  ['protein-shake', 'Протеиновый коктейль', 'Белковый напиток с мягким вкусом', 350, 230, 31, 5, 16, 290, 'protein-shake', 'Напитки'],
  ['brownie-sugar-free', 'Брауни без сахара', 'Насыщенный шоколадный десерт', 110, 260, 9, 17, 23, 250, 'brownie', 'Десерты'],
  ['syrniki', 'Сырники', 'Нежный творожный завтрак', 220, 360, 24, 14, 35, 340, 'syrniki', 'Завтраки'],
  ['chicken-rice-bowl', 'Боул с курицей и рисом', 'Сбалансированный боул с овощами', 360, 510, 38, 16, 55, 470, 'chicken-rice-bowl', 'Основное'],
] as const;

export async function seedDatabase(db: SQLiteDatabase) {
  const statement = await db.prepareAsync(`INSERT OR IGNORE INTO products
    (slug, name, description, serving_size_g, calories, protein_g, fat_g, carbs_g, price, image_key, category, is_available, data_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'demo')`);
  try {
    for (const product of demoProducts) await statement.executeAsync([...product]);
  } finally {
    await statement.finalizeAsync();
  }
  await db.runAsync(`INSERT OR IGNORE INTO flow_state (id, current_streak, longest_streak, updated_at) VALUES (1, 0, 0, ?)`, new Date().toISOString());
}
