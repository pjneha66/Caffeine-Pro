/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Drink {
  id: string;
  name: string;
  brand: string;
  category: 'Energy' | 'Soft Drink' | 'Coffee' | 'Tea' | 'Other';
  caffeinePer100ml: number; // in mg
  defaultSize: number; // in ml
  isCustom?: boolean;
}

export const INDIAN_DRINKS: Drink[] = [
  // Energy Drinks
  { id: 'red-bull-250', name: 'Red Bull', brand: 'Red Bull', category: 'Energy', caffeinePer100ml: 32, defaultSize: 250 },
  { id: 'red-bull-355', name: 'Red Bull (Large)', brand: 'Red Bull', category: 'Energy', caffeinePer100ml: 32, defaultSize: 355 },
  { id: 'monster-350', name: 'Monster Energy', brand: 'Monster', category: 'Energy', caffeinePer100ml: 32, defaultSize: 350 },
  { id: 'monster-473', name: 'Monster Energy (Large)', brand: 'Monster', category: 'Energy', caffeinePer100ml: 32, defaultSize: 473 },
  { id: 'sting-250', name: 'Sting Energy', brand: 'PepsiCo', category: 'Energy', caffeinePer100ml: 28.8, defaultSize: 250 },
  { id: 'sting-500', name: 'Sting Energy (Large)', brand: 'PepsiCo', category: 'Energy', caffeinePer100ml: 28.8, defaultSize: 500 },
  { id: 'predator-250', name: 'Predator Energy', brand: 'Monster', category: 'Energy', caffeinePer100ml: 30, defaultSize: 250 },
  { id: 'tzinga-250', name: 'Tzinga Energy', brand: 'Tzinga', category: 'Energy', caffeinePer100ml: 30, defaultSize: 250 },

  // Soft Drinks
  { id: 'coke-250', name: 'Coca-Cola', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 9.6, defaultSize: 250 },
  { id: 'coke-330', name: 'Coca-Cola (Can)', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 9.6, defaultSize: 330 },
  { id: 'coke-500', name: 'Coca-Cola (Bottle)', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 9.6, defaultSize: 500 },
  { id: 'pepsi-250', name: 'Pepsi', brand: 'Pepsi', category: 'Soft Drink', caffeinePer100ml: 10.5, defaultSize: 250 },
  { id: 'thums-up-250', name: 'Thums Up', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 10, defaultSize: 250 },
  { id: 'mountain-dew-250', name: 'Mountain Dew', brand: 'Pepsi', category: 'Soft Drink', caffeinePer100ml: 15, defaultSize: 250 },
  { id: 'diet-coke-250', name: 'Diet Coke', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 12.8, defaultSize: 250 },
  { id: 'pepsi-black-250', name: 'Pepsi Black', brand: 'Pepsi', category: 'Soft Drink', caffeinePer100ml: 10.5, defaultSize: 250 },
  { id: 'sprite', name: 'Sprite', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 0, defaultSize: 250 },
  { id: 'limca', name: 'Limca', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 0, defaultSize: 250 },
  { id: 'fanta', name: 'Fanta', brand: 'Coke', category: 'Soft Drink', caffeinePer100ml: 0, defaultSize: 250 },

  // Coffee
  { id: 'instant-coffee', name: 'Instant Coffee (Nescafé)', brand: 'General', category: 'Coffee', caffeinePer100ml: 31, defaultSize: 200 }, // ~62mg per mug
  { id: 'brewed-coffee', name: 'Brewed Coffee', brand: 'General', category: 'Coffee', caffeinePer100ml: 40, defaultSize: 200 },
  { id: 'strong-coffee', name: 'Strong Coffee', brand: 'General', category: 'Coffee', caffeinePer100ml: 60, defaultSize: 200 },
  { id: 'espresso-single', name: 'Espresso (Single)', brand: 'General', category: 'Coffee', caffeinePer100ml: 212, defaultSize: 30 }, // ~63mg
  { id: 'espresso-double', name: 'Espresso (Double)', brand: 'General', category: 'Coffee', caffeinePer100ml: 212, defaultSize: 60 }, // ~126mg
  { id: 'cold-coffee', name: 'Cold Coffee (Café Style)', brand: 'General', category: 'Coffee', caffeinePer100ml: 25, defaultSize: 300 },
  { id: 'filter-coffee', name: 'Filter Coffee (South Indian)', brand: 'General', category: 'Coffee', caffeinePer100ml: 50, defaultSize: 150 },

  // Tea
  { id: 'regular-chai', name: 'Regular Chai', brand: 'General', category: 'Tea', caffeinePer100ml: 20, defaultSize: 150 }, // ~30mg per cup
  { id: 'strong-chai', name: 'Strong Chai (Kadak)', brand: 'General', category: 'Tea', caffeinePer100ml: 33, defaultSize: 150 }, // ~50mg
  { id: 'green-tea', name: 'Green Tea', brand: 'General', category: 'Tea', caffeinePer100ml: 12, defaultSize: 200 }, // ~24mg
  { id: 'black-tea', name: 'Black Tea', brand: 'General', category: 'Tea', caffeinePer100ml: 22, defaultSize: 200 }, // ~44mg

  // Others
  { id: 'bournvita', name: 'Bournvita / Horlicks', brand: 'General', category: 'Other', caffeinePer100ml: 2, defaultSize: 200 },
  { id: 'dark-chocolate-drink', name: 'Dark Chocolate Drink', brand: 'General', category: 'Other', caffeinePer100ml: 5, defaultSize: 200 },
];
