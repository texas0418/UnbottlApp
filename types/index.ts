export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified';
export type BeerType = 'lager' | 'ale' | 'ipa' | 'stout' | 'porter' | 'wheat' | 'pilsner' | 'sour' | 'craft';
export type SpiritType = 'whiskey' | 'vodka' | 'gin' | 'rum' | 'tequila' | 'brandy' | 'liqueur' | 'mezcal';
export type CocktailType = 'signature' | 'classic' | 'seasonal' | 'mocktail';
export type NonAlcoholicType = 'soda' | 'juice' | 'coffee' | 'tea' | 'water' | 'mocktail' | 'other';

export type BeverageCategory = 'wine' | 'beer' | 'spirit' | 'cocktail' | 'non-alcoholic';

export type DietaryTag = 'vegan' | 'organic' | 'low-sulfite' | 'gluten-free' | 'natural' | 'biodynamic';

export const dietaryTagLabels: Record<DietaryTag, string> = {
  vegan: 'Vegan',
  organic: 'Organic',
  'low-sulfite': 'Low Sulfite',
  'gluten-free': 'Gluten-Free',
  natural: 'Natural',
  biodynamic: 'Biodynamic',
};

export const dietaryTagColors: Record<DietaryTag, string> = {
  vegan: '#4CAF50',
  organic: '#8BC34A',
  'low-sulfite': '#FF9800',
  'gluten-free': '#2196F3',
  natural: '#795548',
  biodynamic: '#9C27B0',
};

export interface FlavorProfile {
  body: number;
  sweetness: number;
  tannins: number;
  acidity: number;
}

export interface BeerProfile {
  bitterness: number; // IBU scale 1-5
  maltiness: number;
  hoppy: number;
  body: number;
}

export interface SpiritProfile {
  smoothness: number;
  complexity: number;
  sweetness: number;
  intensity: number;
}

export interface Wine {
  id: string;
  name: string;
  producer: string;
  type: WineType;
  vintage: number | null;
  region: string;
  country: string;
  grape: string;
  alcoholContent: number;
  price: number;
  glassPrice: number | null;
  tastingNotes: string;
  foodPairings: string[];
  inStock: boolean;
  quantity: number;
  imageUrl: string | null;
  featured: boolean;
  flavorProfile: FlavorProfile;
  dietaryTags: DietaryTag[];
  createdAt: string;
  updatedAt: string;
}

export interface Beer {
  id: string;
  name: string;
  brewery: string;
  type: BeerType;
  style: string;
  abv: number;
  ibu: number | null;
  origin: string;
  price: number;
  servingSize: string;
  description: string;
  foodPairings: string[];
  inStock: boolean;
  quantity: number;
  imageUrl: string | null;
  featured: boolean;
  beerProfile: BeerProfile;
  dietaryTags: DietaryTag[];
  createdAt: string;
  updatedAt: string;
}

export interface Spirit {
  id: string;
  name: string;
  brand: string;
  type: SpiritType;
  origin: string;
  age: string | null;
  abv: number;
  price: number;
  shotPrice: number | null;
  description: string;
  mixers: string[];
  inStock: boolean;
  quantity: number;
  imageUrl: string | null;
  featured: boolean;
  spiritProfile: SpiritProfile;
  dietaryTags: DietaryTag[];
  createdAt: string;
  updatedAt: string;
}

export interface Cocktail {
  id: string;
  name: string;
  type: CocktailType;
  baseSpirit: string;
  ingredients: string[];
  garnish: string;
  glassType: string;
  price: number;
  description: string;
  isSignature: boolean;
  isAvailable: boolean;
  imageUrl: string | null;
  featured: boolean;
  dietaryTags: DietaryTag[];
  createdAt: string;
  updatedAt: string;
}

export interface NonAlcoholicBeverage {
  id: string;
  name: string;
  brand: string | null;
  type: NonAlcoholicType;
  description: string;
  price: number;
  servingSize: string;
  calories: number | null;
  ingredients: string[];
  inStock: boolean;
  quantity: number;
  imageUrl: string | null;
  featured: boolean;
  dietaryTags: DietaryTag[];
  createdAt: string;
  updatedAt: string;
}

export type Beverage = 
  | (Wine & { category: 'wine' })
  | (Beer & { category: 'beer' })
  | (Spirit & { category: 'spirit' })
  | (Cocktail & { category: 'cocktail' })
  | (NonAlcoholicBeverage & { category: 'non-alcoholic' });

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  cuisineType: string;
  menuSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  restaurantIds: string[];
  currentRestaurantId: string | null;
  createdAt: string;
}

export interface MenuSection {
  id: string;
  title: string;
  description: string;
  items: Wine[];
}

export interface JournalEntry {
  id: string;
  beverageId: string | null;
  beverageCategory: BeverageCategory;
  beverageName: string;
  beverageType: string;
  producer: string;
  vintage: number | null;
  rating: number;
  notes: string;
  occasion: string;
  location: string;
  date: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export const beverageCategoryLabels: Record<BeverageCategory, string> = {
  wine: 'Wine',
  beer: 'Beer',
  spirit: 'Spirits & Liquors',
  cocktail: 'Cocktails',
  'non-alcoholic': 'Non-Alcoholic',
};

export const beverageCategoryIcons: Record<BeverageCategory, string> = {
  wine: 'Wine',
  beer: 'Beer',
  spirit: 'GlassWater',
  cocktail: 'Martini',
  'non-alcoholic': 'Coffee',
};
