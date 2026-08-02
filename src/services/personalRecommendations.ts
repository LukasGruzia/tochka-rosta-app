import type { MealType, Product, ProfileDraft } from '@/types/domain';

const restrictedTerms: Record<ProfileDraft['restrictions'][number], string[]> = {
  lactoseFree: ['milk', 'lactose', 'молоко', 'лактоз'], glutenFree: ['gluten', 'wheat', 'глютен', 'пшениц'], sugarFree: ['sugar', 'сахар'], nutFree: ['nut', 'peanut', 'орех', 'арахис'],
};

export function rankPersonalRecommendations(products: Product[], profile: ProfileDraft, remainingCalories: number, meal?: MealType) {
  return products.map((product) => {
    const allergenText = product.allergens.join(' ').toLocaleLowerCase('ru-RU');
    if (profile.restrictions.some((restriction) => restrictedTerms[restriction].some((term) => allergenText.includes(term)))) return null;
    if (profile.dietPreference === 'vegetarian' && (product.dietTags.includes('meat') || product.dietTags.includes('fish'))) return null;
    if (profile.dietPreference === 'plant' && (product.dietTags.includes('meat') || product.dietTags.includes('fish') || product.dietTags.includes('dairy') || product.dietTags.includes('egg'))) return null;
    const servingCalories = product.caloriesPer100g * product.servingSizeG / 100;
    let score = product.isFavorite ? 50 : 0;
    score += product.goalTags.includes(profile.goal) ? 35 : 0;
    score += meal && product.mealTags.includes(meal) ? 25 : 0;
    score += Math.max(0, 30 - Math.abs(Math.max(0, remainingCalories) - servingCalories) / 20);
    score += product.sourceType === 'tochka_rosta' ? 10 : 0;
    return { product, score };
  }).filter((item): item is { product: Product; score: number } => item !== null).sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'ru')).map((item) => item.product);
}
