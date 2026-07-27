import type { Product } from '@/types/domain';

export function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();
}

function distance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return matrix[a.length][b.length];
}

function matchScore(product: Product, query: string) {
  if (!query) return 1;
  const normalizedName = normalizeSearchText(product.name);
  const values = [normalizedName, normalizeSearchText(product.originalName ?? ''), ...product.aliases.map(normalizeSearchText)];
  if (values.some((value) => value === query)) return 1000;
  if (values.some((value) => value.startsWith(query))) return 800;
  if (values.some((value) => value.includes(query))) return 650;
  const queryTokens = query.split(' ').filter(Boolean);
  const valueTokens = values.flatMap((value) => value.split(' ')).filter(Boolean);
  const matchedTokens = queryTokens.filter((token) => valueTokens.some((valueToken) => valueToken.startsWith(token) || token.startsWith(valueToken) || distance(token, valueToken) <= (token.length >= 5 ? 2 : 1)));
  return matchedTokens.length === queryTokens.length ? 400 + matchedTokens.length * 10 : 0;
}

function sourcePriority(product: Product) {
  if (product.sourceType === 'user_product' || product.sourceType === 'user_recipe') return 90;
  if (product.sourceType === 'tochka_rosta') return 70;
  if (product.isFavorite) return 60;
  if (product.sourceType === 'usda') return 40;
  return 20;
}

export function searchProducts(products: Product[], query: string) {
  const normalized = normalizeSearchText(query);
  return products
    .map((product) => ({ product, score: matchScore(product, normalized) + sourcePriority(product) }))
    .filter((item) => !normalized || item.score > sourcePriority(item.product))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'ru'))
    .map((item) => item.product);
}

export function groupProductsBySource(products: Product[]) {
  return {
    my: products.filter((product) => product.sourceType === 'user_product' || product.sourceType === 'user_recipe'),
    tochka: products.filter((product) => product.sourceType === 'tochka_rosta'),
    common: products.filter((product) => product.sourceType === 'usda'),
    barcode: products.filter((product) => product.sourceType === 'open_food_facts'),
  };
}
