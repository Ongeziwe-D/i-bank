/**
 * The API names icons with Feather/Lucide-style names (e.g. "shopping-cart");
 * this maps them to the Material Symbols names the app's icon font uses.
 */
const CATEGORY_ICONS: Record<string, string> = {
  'shopping-cart': 'shopping_cart',
  film: 'movie',
  car: 'directions_car',
  utensils: 'restaurant',
  'shopping-bag': 'shopping_bag',
  zap: 'bolt',
};

export function toMaterialIcon(apiIcon: string): string {
  return CATEGORY_ICONS[apiIcon] ?? 'category';
}
