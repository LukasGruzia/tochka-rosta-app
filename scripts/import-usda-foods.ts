#!/usr/bin/env node
/**
 * Builds the compact offline catalog from official FoodData Central JSON exports.
 * Usage: node scripts/import-usda-foods.ts <foundation.json> <fndds.json> [output.json]
 * No API key or network access is used by this script.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

type RawFood = { fdcId: number; description: string; dataType?: string; publicationDate?: string; foodNutrients?: { nutrient?: { id?: number; name?: string; unitName?: string }; amount?: number }[]; foodPortions?: { gramWeight?: number; portionDescription?: string }[]; wweiaFoodCategory?: { wweiaFoodCategoryDescription?: string } };
export type CompactFood = { fdcId: number; name: string; originalName: string; category: string; caloriesPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; fiberPer100g: number | null; sugarPer100g: number | null; sodiumPer100g: number | null; servingSizeG: number; aliases: string[]; sourceVersion: string; canonicalKey?: string; brand?: string | null; preparationState?: string | null; sourcePriority?: number; isActive?: boolean; reviewStatus?: 'verified' | 'needs_review' };

const categories = [
  ['Спортивное питание', /\b(protein powder|protein bar|sports drink|energy gel|whey protein)\b/i],
  ['Детское питание', /\b(baby food|infant formula|toddler food|infant cereal)\b/i],
  ['Растительные альтернативы', /\b(tofu|tempeh|seitan|plant-based|soy milk|almond milk|oat milk)\b/i],
  ['Десерты', /\b(cake|cookie|brownie|chocolate|pudding|ice cream|dessert|doughnut|donut)\b/i],
  ['Фастфуд', /\b(burger|hamburger|hot dog|nachos|fried chicken|cheeseburger)\b/i],
  ['Крупы', /\b(rice|oat|oatmeal|buckwheat|bulgur|quinoa|millet|barley|farro|grain|cereal|grits|sorghum|fonio|einkorn|khorasan)\b/i],
  ['Макароны', /\b(pasta|spaghetti|macaroni|noodle|vermicelli|lasagna)\b/i],
  ['Хлеб', /\b(bread|roll|bun|bagel|tortilla|pita|toast|cracker|biscuit|muffin)\b/i],
  ['Мука', /\bflour\b/i],
  ['Картофель', /\b(potato|potatoes|french fries)\b/i],
  ['Зелень', /\b(kale|spinach|lettuce|arugula|collard|parsley|cilantro|dill|basil|beet greens)\b/i],
  ['Овощи', /\b(tomato|carrot|broccoli|cucumber|cabbage|onion|garlic|pepper|cauliflower|celery|squash|zucchini|eggplant|beet|asparagus|corn|mushroom|radish|turnip|parsnip|leek|shallot|fennel|vegetable)\b/i],
  ['Ягоды', /\b(strawberr|raspberr|blueberr|blackberr|cranberr|cherr)\w*/i],
  ['Фрукты', /\b(apple|banana|orange|grapefruit|pear|peach|nectarine|pineapple|grape|melon|watermelon|mango|kiwi|apricot|plum|fig|papaya|fruit|mandarin|avocado)\w*/i],
  ['Бобовые', /\b(bean|lentil|chickpea|pea|legume|hummus|blackeye)\w*/i],
  ['Орехи', /\b(almond|walnut|pecan|cashew|hazelnut|pistachio|peanut|macadamia|brazilnut|pine nut)\w*/i],
  ['Семена', /\b(seed|flaxseed|chia|sesame)\w*/i],
  ['Птица', /\b(chicken|turkey|duck|poultry)\b/i],
  ['Мясо', /\b(beef|pork|ham|bacon|lamb|bison|veal|meat|sausage|frankfurter)\b/i],
  ['Морепродукты', /\b(shrimp|crab|lobster|scallop|squid|shellfish|clam|oyster|mussel)\w*/i],
  ['Рыба', /\b(salmon|tuna|cod|fish|haddock|pollock|tilapia|catfish|halibut|anchov|swordfish|snapper|sea bass|mahi)\w*/i],
  ['Яйца', /\b(egg|omelet)\w*/i],
  ['Кисломолочные продукты', /\b(yogurt|kefir|buttermilk|sour cream|cottage cheese)\b/i],
  ['Сыры', /\b(cheese|parmesan|cheddar|mozzarella|ricotta|feta|provolone)\b/i],
  ['Молоко', /\b(milk|cream)\b/i],
  ['Масла', /\b(oil|butter|margarine|animal fats)\b/i],
  ['Соусы', /\b(sauce|ketchup|mustard|mayonnaise|dressing|salsa|condiment|gravy|dip)\b/i],
  ['Сахар и подсластители', /\b(sugar|honey|sweetener|syrup|jam)\b/i],
  ['Напитки', /\b(juice|coffee|tea|water|drink|smoothie|beverage)\b/i],
  ['Готовые блюда', /\b(soup|salad|sandwich|pizza|rice|pasta|noodle|burrito|taco|stew|casserole|pancake|waffle|dumpling|sushi|meal|dish)\b/i],
] as const;

const names: [RegExp, string, string[]][] = [
  [/protein powder|whey protein/i, 'Протеиновый порошок', ['протеин']], [/protein bar/i, 'Протеиновый батончик', []], [/sports drink/i, 'Спортивный напиток', ['изотоник']],
  [/tofu/i, 'Тофу', ['соевый сыр']], [/tempeh/i, 'Темпе', []], [/seitan/i, 'Сейтан', []], [/(soy|almond|oat) milk/i, 'Растительный напиток', ['растительное молоко']],
  [/baby food|infant formula|toddler food/i, 'Детское питание', []],
  [/burger|hamburger/i, 'Бургер', ['гамбургер']], [/cookie/i, 'Печенье', []], [/chocolate/i, 'Шоколад', []], [/ice cream/i, 'Мороженое', []], [/cake/i, 'Торт', []],
  [/^flour.*buckwheat/i, 'Мука гречневая', []], [/^flour.*rice/i, 'Мука рисовая', []], [/^flour.*whole wheat/i, 'Мука цельнозерновая', []], [/^flour/i, 'Мука', []],
  [/^buckwheat groats$/i, 'Гречка варёная', ['гречневая каша', 'гречка готовая', 'каша гречневая']], [/buckwheat.*(cooked|boiled)/i, 'Гречка варёная', ['гречневая каша', 'гречка готовая', 'каша гречневая']], [/buckwheat/i, 'Гречка сухая', ['гречневая крупа', 'ядрица']],
  [/rice.*brown.*(cooked|boiled)/i, 'Рис бурый варёный', ['бурый рис готовый']], [/rice.*brown/i, 'Рис бурый сухой', ['коричневый рис']], [/rice.*white.*(cooked|boiled)/i, 'Рис белый варёный', ['рис готовый']], [/rice.*white/i, 'Рис белый сухой', ['белый рис']],
  [/oats?.*(rolled|old fashioned)/i, 'Овсяные хлопья', ['овсянка', 'геркулес']], [/oatmeal/i, 'Овсяная каша', ['овсянка готовая']], [/bulgur/i, 'Булгур', ['пшеничная крупа булгур']], [/quinoa/i, 'Киноа', ['квиноа']],
  [/(pasta|spaghetti|macaroni|noodles?).*(cooked|boiled)/i, 'Макароны варёные', ['паста готовая']], [/(pasta|spaghetti|macaroni|noodles?)/i, 'Макароны сухие', ['паста', 'спагетти']],
  [/potato.*(boiled|baked)/i, 'Картофель приготовленный', ['картошка готовая']], [/potato/i, 'Картофель', ['картошка']],
  [/bread.*rye|rye bread/i, 'Хлеб ржаной', ['чёрный хлеб']], [/bread/i, 'Хлеб', ['батон', 'буханка']],
  [/chicken.*breast/i, 'Куриная грудка', ['филе курицы', 'куриное филе']], [/chicken.*thigh/i, 'Куриное бедро', ['бедро курицы']], [/chicken/i, 'Курица', []], [/turkey/i, 'Индейка', []],
  [/beef/i, 'Говядина', []], [/pork/i, 'Свинина', []], [/lamb/i, 'Баранина', []], [/bison/i, 'Бизон', []],
  [/salmon/i, 'Лосось', ['сёмга']], [/tuna/i, 'Тунец', []], [/cod/i, 'Треска', []], [/haddock/i, 'Пикша', []], [/pollock/i, 'Минтай', []], [/tilapia/i, 'Тилапия', []], [/fish/i, 'Рыба', []],
  [/shrimp/i, 'Креветки', []], [/crab/i, 'Краб', []], [/squid/i, 'Кальмар', []], [/scallop/i, 'Морской гребешок', []], [/lobster/i, 'Лобстер', []],
  [/egg.*white/i, 'Яичный белок', []], [/egg.*yolk/i, 'Яичный желток', []], [/egg/i, 'Яйцо', ['яйцо куриное']],
  [/kefir/i, 'Кефир', []], [/cottage cheese/i, 'Творог зернёный', ['творог']], [/yogurt.*greek/i, 'Йогурт греческий', []], [/yogurt/i, 'Йогурт', []], [/milk/i, 'Молоко', []],
  [/cheese.*parmesan|parmesan/i, 'Сыр пармезан', []], [/cheese.*cheddar|cheddar/i, 'Сыр чеддер', []], [/mozzarella/i, 'Сыр моцарелла', []], [/cheese/i, 'Сыр', []],
  [/butter/i, 'Масло сливочное', []], [/(oil.*olive|olive.*oil)/i, 'Масло оливковое', []], [/(oil.*sunflower|sunflower.*oil)/i, 'Масло подсолнечное', []], [/oil/i, 'Масло растительное', []],
  [/apple/i, 'Яблоко', []], [/banana/i, 'Банан', []], [/orange/i, 'Апельсин', []], [/grapefruit/i, 'Грейпфрут', []], [/pear/i, 'Груша', []], [/peach/i, 'Персик', []], [/pineapple/i, 'Ананас', []], [/grape/i, 'Виноград', []], [/melon/i, 'Дыня', []], [/watermelon/i, 'Арбуз', []], [/mango/i, 'Манго', []], [/kiwi/i, 'Киви', []],
  [/strawberr/i, 'Клубника', ['земляника садовая']], [/raspberr/i, 'Малина', []], [/blueberr/i, 'Голубика', ['черника']], [/blackberr/i, 'Ежевика', []], [/cherr/i, 'Вишня или черешня', []],
  [/tomato/i, 'Помидор', ['томат']], [/cucumber/i, 'Огурец', []], [/cabbage/i, 'Капуста', []], [/carrot/i, 'Морковь', []], [/broccoli/i, 'Брокколи', []], [/cauliflower/i, 'Цветная капуста', []], [/onion/i, 'Лук', []], [/garlic/i, 'Чеснок', []], [/pepper/i, 'Перец', []], [/mushroom/i, 'Грибы', []], [/spinach/i, 'Шпинат', []], [/lettuce/i, 'Салат листовой', []],
  [/chickpea/i, 'Нут', ['турецкий горох']], [/lentil/i, 'Чечевица', []], [/bean/i, 'Фасоль', []], [/pea/i, 'Горох', []], [/hummus/i, 'Хумус', []],
  [/almond/i, 'Миндаль', []], [/walnut/i, 'Грецкий орех', []], [/cashew/i, 'Кешью', []], [/hazelnut/i, 'Фундук', []], [/peanut/i, 'Арахис', []], [/pistachio/i, 'Фисташки', []], [/nuts?/i, 'Орехи', []],
  [/sunflower.*seed/i, 'Семечки подсолнечника', []], [/pumpkin.*seed/i, 'Семена тыквы', []], [/flax/i, 'Семена льна', []], [/chia/i, 'Семена чиа', []], [/seed/i, 'Семена', []],
  [/ketchup/i, 'Кетчуп', []], [/mustard/i, 'Горчица', []], [/mayonnaise/i, 'Майонез', []], [/sauce/i, 'Соус', []], [/sugar/i, 'Сахар', []], [/honey/i, 'Мёд', []], [/juice/i, 'Сок', []], [/coffee/i, 'Кофе', []], [/tea/i, 'Чай', []], [/water/i, 'Вода', []],
  [/soup/i, 'Суп', []], [/salad/i, 'Салат', []], [/sandwich/i, 'Сэндвич', []], [/pizza/i, 'Пицца', []], [/pancake/i, 'Блины', []], [/waffle/i, 'Вафли', []],
];

const modifiers: [RegExp, string][] = [[/\braw\b/i, 'сырой'], [/\bdry|dried\b/i, 'сухой'], [/\bcooked|boiled|braised\b/i, 'приготовленный'], [/\bsteamed\b/i, 'на пару'], [/\bfried|pan-fried\b/i, 'жареный'], [/\bbaked|roasted\b/i, 'запечённый'], [/\bcanned\b/i, 'консервированный'], [/\bfrozen\b/i, 'замороженный'], [/\bskinless|without skin\b/i, 'без кожи'], [/\bunsalted|without salt\b/i, 'без соли'], [/\bnonfat|fat free|skim\b/i, 'обезжиренный'], [/\bwhole\b/i, 'цельный']];

function nutrient(food: RawFood, ids: number[]) { const item = food.foodNutrients?.find((entry) => ids.includes(entry.nutrient?.id ?? -1) && typeof entry.amount === 'number'); return item?.amount ?? null; }
function classify(food: RawFood) { return categories.find(([, pattern]) => pattern.test(food.description))?.[0] ?? categories.find(([, pattern]) => pattern.test(food.wweiaFoodCategory?.wweiaFoodCategoryDescription ?? ''))?.[0] ?? null; }
const descriptorTranslations: [RegExp, string][] = [
  [/\bnot reconstituted\b/gi, 'неразведённый'], [/\blow calorie\b/gi, 'низкокалорийный'], [/\blow fat\b/gi, 'нежирный'],
  [/\bfat free\b|\bnonfat\b|\bskim\b/gi, 'обезжиренный'], [/\bwhole grain\b/gi, 'цельнозерновой'],
  [/\bwhole wheat\b/gi, 'цельнозерновой пшеничный'], [/\bwheat\b/gi, 'пшеничный'], [/\brye\b/gi, 'ржаной'],
  [/\bwhite\b/gi, 'белый'], [/\bbrown\b/gi, 'бурый'], [/\braw\b/gi, 'сырой'], [/\bdry|dried\b/gi, 'сухой'],
  [/\bcooked|boiled|braised\b/gi, 'приготовленный'], [/\bsteamed\b/gi, 'на пару'], [/\bfried|pan-fried\b/gi, 'жареный'],
  [/\bbaked|roasted\b/gi, 'запечённый'], [/\bcanned\b/gi, 'консервированный'], [/\bfrozen\b/gi, 'замороженный'],
  [/\btoasted\b/gi, 'поджаренный'], [/\bunsalted|without salt\b/gi, 'без соли'], [/\bsweetened\b/gi, 'с сахаром'],
  [/\bunsweetened\b/gi, 'без сахара'], [/\bplain\b/gi, 'натуральный'], [/\bflavored\b/gi, 'ароматизированный'],
  [/\bwith skin\b/gi, 'с кожей'], [/\bskinless|without skin\b/gi, 'без кожи'], [/\bbreast\b/gi, 'грудка'],
  [/\bthigh\b/gi, 'бедро'], [/\bground\b/gi, 'фарш'], [/\bfresh\b/gi, 'свежий'], [/\bcommercially prepared\b/gi, 'готовый'],
  [/\bhome prepared\b/gi, 'домашний'], [/\bNFS\b/gi, 'без уточнения'],
];

function translateDescriptor(value: string) {
  let result = value;
  for (const [pattern, replacement] of descriptorTranslations) result = result.replace(pattern, replacement);
  return result.replace(/[()]/g, '').replace(/\s*,\s*/g, ', ').replace(/(?:^|, )and(?:, |$)/gi, ', ').replace(/\s+/g, ' ').replace(/^[,;\s-]+|[,;\s-]+$/g, '').trim();
}

const specificNames: [RegExp, string, string[]][] = [
  [/soy milk/i, 'Соевый напиток', ['соевое молоко']], [/almond milk/i, 'Миндальный напиток', ['миндальное молоко']],
  [/oat milk/i, 'Овсяный напиток', ['овсяное молоко']], [/rice.*white and wild/i, 'Рис белый с диким', []],
  [/rice.*brown and wild/i, 'Рис бурый с диким', []], [/pasta.*vegetable/i, 'Макароны овощные', []],
  [/sandwich/i, 'Сэндвич', []],
  [/avocado/i, 'Авокадо', []],
];

export function translateUsdaName(description: string, category?: string) {
  const found = specificNames.find(([pattern]) => pattern.test(description)) ?? names.find(([pattern]) => pattern.test(description));
  const base = found?.[1] ?? category ?? 'Продукт';
  const tags = modifiers.filter(([pattern]) => pattern.test(description)).map(([, value]) => value);
  const uniqueTags = [...new Set(tags)].slice(0, 2);
  const name = uniqueTags.length && !base.toLowerCase().includes(uniqueTags[0]) ? `${base}, ${uniqueTags.join(', ')}` : base;
  const rawDescriptor = found ? description.replace(found[0], ' ') : description;
  return { base, name, descriptor: translateDescriptor(rawDescriptor), aliases: [...new Set([base.toLowerCase(), ...(found?.[2] ?? [])])] };
}

function normalizeCanonicalPart(value: string) { return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function normalizeAlias(value: string) { return value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); }
function macroVector(food: CompactFood) { return [food.caloriesPer100g, food.proteinPer100g, food.fatPer100g, food.carbsPer100g]; }
function macrosAreCompatible(left: CompactFood, right: CompactFood) {
  return macroVector(left).every((value, index) => Math.abs(value - macroVector(right)[index]) <= Math.max(0.5, Math.abs(value) * 0.03));
}
function preparationState(description: string) { return modifiers.find(([pattern]) => pattern.test(description))?.[1] ?? null; }
function sourcePriority(version: string) { return version.includes('Foundation') ? 80 : 60; }
function extractBrand(description: string) { const value = description.match(/\(([^)]+)\)/)?.[1]?.trim(); return value && /[A-Z]/.test(value) ? value : null; }

export function finalizeCatalogNames(input: CompactFood[]) {
  const foods: (CompactFood & { _descriptor: string })[] = input.map((food) => {
    const translated = translateUsdaName(food.originalName, food.category);
    return { ...food, name: translated.name, aliases: [...new Set([...food.aliases, ...translated.aliases, food.originalName.toLowerCase()].flatMap((alias) => [alias, normalizeAlias(alias)]))], canonicalKey: `usda:${normalizeCanonicalPart(food.originalName)}`, brand: extractBrand(food.originalName), preparationState: preparationState(food.originalName), sourcePriority: sourcePriority(food.sourceVersion), isActive: true, reviewStatus: 'verified', _descriptor: translated.descriptor };
  });
  const displayGroups = Map.groupBy(foods, (food) => food.name.toLocaleLowerCase('ru'));
  for (const group of displayGroups.values()) {
    if (group.length < 2) continue;
    for (const food of group) if (food._descriptor) food.name = `${food.name} — ${food._descriptor}`;
  }
  const canonicalGroups = Map.groupBy(foods, (food) => food.canonicalKey);
  for (const group of canonicalGroups.values()) {
    if (group.length < 2) continue;
    group.sort((left, right) => (right.sourcePriority ?? 0) - (left.sourcePriority ?? 0) || left.fdcId - right.fdcId);
    const primary = group[0];
    for (const secondary of group.slice(1)) {
      if (!macrosAreCompatible(primary, secondary)) {
        primary.reviewStatus = 'needs_review'; secondary.reviewStatus = 'needs_review'; secondary.isActive = false;
      } else secondary.isActive = false;
    }
  }
  return foods.map(({ _descriptor: _ignored, ...food }) => food);
}

export function normalizeUsdaFood(food: RawFood, sourceVersion: string): CompactFood | null {
  if (!food?.description || !food.fdcId) return null; const category = classify(food); if (!category) return null;
  const calories = nutrient(food, [1008, 2047, 2048]); const protein = nutrient(food, [1003]); const fat = nutrient(food, [1004]); const carbs = nutrient(food, [1005]);
  if ([calories, protein, fat, carbs].some((value) => value == null || !Number.isFinite(value))) return null;
  const translated = translateUsdaName(food.description, category); const portion = food.foodPortions?.find((item) => (item.gramWeight ?? 0) > 0)?.gramWeight ?? 100;
  return { fdcId: food.fdcId, name: translated.name, originalName: food.description, category, caloriesPer100g: calories!, proteinPer100g: protein!, fatPer100g: fat!, carbsPer100g: carbs!, fiberPer100g: nutrient(food, [1079]), sugarPer100g: nutrient(food, [2000]), sodiumPer100g: nutrient(food, [1093]), servingSizeG: Math.min(1000, Math.max(1, portion)), aliases: translated.aliases, sourceVersion };
}

function readFoods(path: string) { const root = JSON.parse(readFileSync(path, 'utf8')) as { FoundationFoods?: (RawFood | null)[]; SurveyFoods?: (RawFood | null)[] }; return (root.FoundationFoods ?? root.SurveyFoods ?? []).filter((item): item is RawFood => Boolean(item)); }
export function buildCatalog(paths: string[], limit = 950) {
  const records = paths.flatMap((path) => readFoods(path).map((food) => ({ food, version: path.toLowerCase().includes('foundation') ? 'Foundation Foods · 2026-04-30' : 'FNDDS 2021–2023 · 2024-10-31' })));
  const raw = records.map((item) => item.food); const normalized = records.map(({ food, version }) => normalizeUsdaFood(food, version)).filter((item): item is CompactFood => item !== null);
  const perCategory = new Map<string, number>(); const seen = new Set<string>(); const result: CompactFood[] = [];
  const required = /buckwheat|rice, (white|brown)|oats?, whole grain|bulgur|quinoa|pasta|potato|bread|chicken, (breast|thigh)|turkey|beef|pork|salmon|tuna|cod|egg|milk|kefir|cottage cheese|yogurt|cheese|butter|olive oil|sunflower oil|apple|banana|orange|tomato|cucumber|cabbage|carrot|broccoli|bean|lentil|chickpea|almond|walnut/i;
  const score = (food: CompactFood) => Number(required.test(food.originalName)) * 4 + Number(/cooked|boiled|buckwheat groats$/i.test(food.originalName)) * 3 + Number(/\braw\b/i.test(food.originalName)) * 3 + Number(food.sourceVersion.includes('2026')) * 2;
  normalized.sort((a, b) => score(b) - score(a) || a.originalName.length - b.originalName.length);
  const add = (food: CompactFood, cap = 44) => { if (result.length >= limit || (perCategory.get(food.category) ?? 0) >= cap) return; const signature = `${food.originalName.toLowerCase().replace(/[^a-z0-9]+/g, ' ')}|${Math.round(food.caloriesPer100g)}`; if (seen.has(signature)) return; seen.add(signature); perCategory.set(food.category, (perCategory.get(food.category) ?? 0) + 1); result.push(food); };
  for (const [category] of categories) for (const food of normalized.filter((item) => item.category === category).slice(0, 20)) add(food, 20);
  for (const food of normalized) add(food);
  return { foods: finalizeCatalogNames(result), report: { sourceFiles: paths.map((path) => resolve(path)), generatedAt: new Date().toISOString(), rawRecords: raw.length, normalizedRecords: normalized.length, exportedRecords: result.length, categories: Object.fromEntries([...perCategory.entries()].sort()), nutrientIds: { calories: [1008, 2047, 2048], protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, sugar: 2000, sodium: 1093 }, translation: 'Контролируемые правила и словарь; точное оригинальное название и состояние продукта используются для различения сущностей.' } };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const inputs = process.argv.slice(2).filter((value) => value.toLowerCase().endsWith('.json')); if (!inputs.length) throw new Error('Передай путь к официальной JSON-выгрузке USDA.');
  const explicitOutput = inputs.length > 2 ? inputs.pop() : undefined; const output = resolve(explicitOutput ?? 'src/database/data/usda-common-foods.json'); const built = buildCatalog(inputs); mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(built.foods, null, 2)}\n`, 'utf8'); const report = resolve(dirname(output), 'usda-import-report.json'); writeFileSync(report, `${JSON.stringify(built.report, null, 2)}\n`, 'utf8'); console.log(`USDA import: ${built.foods.length} foods -> ${output}`); console.log(`Report -> ${report}`);
}
