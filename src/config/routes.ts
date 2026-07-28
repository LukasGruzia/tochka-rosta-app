import type { IconName } from '@/components/AppIcon';

export const TAB_ROUTES = [
  { key: 'index', route: '/(tabs)', title: 'Главная', icon: 'home', action: '/food-search' },
  { key: 'diary', route: '/(tabs)/diary', title: 'Дневник', icon: 'diary', action: '/(tabs)/diary?calendar=1' },
  { key: 'catalog', route: '/(tabs)/catalog', title: 'Каталог', icon: 'catalog', action: '/food-search' },
  { key: 'flow', route: '/(tabs)/flow', title: 'Поток', icon: 'flow', action: '/(tabs)/flow' },
  { key: 'profile', route: '/(tabs)/profile', title: 'Профиль', icon: 'profile', action: '/appearance' },
] as const satisfies readonly { key: string; route: string; title: string; icon: IconName; action: string }[];

export type TabRouteKey = (typeof TAB_ROUTES)[number]['key'];

export function getTabRoute(key: string) {
  return TAB_ROUTES.find((item) => item.key === key);
}

export function validateTabRoutes() {
  return TAB_ROUTES.map((item) => ({
    key: item.key,
    valid: Boolean(item.route && item.route.startsWith('/') && item.title),
    route: item.route,
  }));
}

export function getProductRoute(id: number | string | null | undefined) {
  const value = typeof id === 'string' ? Number(id) : id;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? `/product/${value}` as const : null;
}
