import type { ExternalFoodPreview } from '@/types/domain';

const endpoint = 'https://world.openfoodfacts.org/api/v3.6/product';
const userAgent = 'TochkaRosta/0.3 (https://github.com/LukasGruzia/tochka-rosta-app)';
const fields = ['code', 'product_name', 'brands', 'quantity', 'serving_size', 'nutriments', 'ingredients_text', 'allergens', 'image_front_url', 'countries', 'last_modified_t'];

function numberOrNull(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function nutrientValue(nutriments: Record<string, unknown>, name: string) {
  const direct = numberOrNull(nutriments[`${name}_100g`]);
  if (direct != null) return direct;
  const nested = nutriments[name];
  if (nested && typeof nested === 'object') {
    const record = nested as Record<string, unknown>;
    return numberOrNull(record['100g'] ?? record.value_100g ?? record.value);
  }
  return null;
}

export function normalizeOpenFoodFactsResponse(barcode: string, payload: unknown): ExternalFoodPreview | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const product = root.product && typeof root.product === 'object' ? root.product as Record<string, unknown> : null;
  if (!product) return null;
  const name = typeof product.product_name === 'string' ? product.product_name.trim() : '';
  if (!name) return null;
  const nutriments = product.nutriments && typeof product.nutriments === 'object' ? product.nutriments as Record<string, unknown> : {};
  const allergensValue = product.allergens;
  const allergens = Array.isArray(allergensValue)
    ? allergensValue.map(String)
    : typeof allergensValue === 'string' ? allergensValue.split(',').map((item) => item.trim()).filter(Boolean) : [];
  const updated = numberOrNull(product.last_modified_t);
  return {
    barcode,
    name,
    brand: typeof product.brands === 'string' ? product.brands : null,
    quantity: typeof product.quantity === 'string' ? product.quantity : null,
    servingSize: typeof product.serving_size === 'string' ? product.serving_size : null,
    caloriesPer100g: nutrientValue(nutriments, 'energy-kcal'),
    proteinPer100g: nutrientValue(nutriments, 'proteins'),
    fatPer100g: nutrientValue(nutriments, 'fat'),
    carbsPer100g: nutrientValue(nutriments, 'carbohydrates'),
    ingredients: typeof product.ingredients_text === 'string' ? product.ingredients_text : null,
    allergens,
    imageUrl: typeof product.image_front_url === 'string' ? product.image_front_url : null,
    countries: typeof product.countries === 'string' ? product.countries : null,
    sourceUpdatedAt: updated == null ? null : new Date(updated * 1000).toISOString(),
    payload: JSON.stringify(payload),
  };
}

export async function fetchOpenFoodFactsProduct(barcode: string, fetcher: typeof fetch = fetch) {
  const normalizedCode = barcode.trim();
  if (!/^\d{8,14}$/.test(normalizedCode)) throw new Error('Штрихкод должен содержать от 8 до 14 цифр');
  let response: Response;
  try {
    response = await fetcher(`${endpoint}/${encodeURIComponent(normalizedCode)}?fields=${encodeURIComponent(fields.join(','))}`, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
    });
  } catch {
    throw new Error('Нет подключения. Ты можешь ввести данные с упаковки вручную.');
  }
  if (response.status === 404) return null;
  if (response.status === 429 || response.status === 503) throw new Error('Сервис временно ограничил запросы. Попробуй позже.');
  if (!response.ok) throw new Error('Не удалось получить данные по штрихкоду');
  return normalizeOpenFoodFactsResponse(normalizedCode, await response.json());
}
