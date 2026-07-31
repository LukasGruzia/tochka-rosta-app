import type { Product } from '@/types/domain';

export function getProductSourceLabel(product: Pick<Product, 'sourceType' | 'dataStatus'>) {
  if (product.sourceType === 'tochka_rosta') return product.dataStatus === 'verified' ? 'Проверено «Точкой Роста»' : 'Блюдо «Точки Роста»';
  if (product.sourceType === 'usda') return 'Официальная база USDA';
  if (product.sourceType === 'open_food_facts') return 'Данные сообщества';
  return 'Добавлено пользователем';
}

export function getProductMatchLabel(index: number) {
  if (index === 0) return 'Отличное совпадение';
  if (index < 3) return 'Хорошо подходит';
  return 'Можно рассмотреть';
}

export function formatProductUpdatedAt(value: string | null) {
  if (!value) return 'Дата обновления не указана';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата обновления не указана';
  return `Обновлено ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}`;
}
