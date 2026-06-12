import { Ionicons } from '@expo/vector-icons';

export type ExpenseCategory =
  | 'general'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'home'
  | 'entertainment'
  | 'travel'
  | 'utilities'
  | 'health';

export const CATEGORY_ICONS: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  general: 'receipt-outline',
  food: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'cart-outline',
  home: 'home-outline',
  entertainment: 'game-controller-outline',
  travel: 'airplane-outline',
  utilities: 'flash-outline',
  health: 'medkit-outline',
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  general: 'General',
  food: 'Food & Drink',
  transport: 'Transport',
  shopping: 'Shopping',
  home: 'Home',
  entertainment: 'Entertainment',
  travel: 'Travel',
  utilities: 'Utilities',
  health: 'Health',
};

export const CATEGORIES: ExpenseCategory[] = Object.keys(CATEGORY_ICONS) as ExpenseCategory[];

export const EMOJI_OPTIONS: string[] = [
  '🍕', '🍔', '🍣', '🍻', '☕️', '🛒',
  '🚕', '⛽️', '✈️', '🏠', '💡', '🎬',
  '🎮', '🏥', '💊', '🎁', '👕', '📱',
  '💻', '🏖️', '🎉', '💰', '📝', '⭐️',
];
