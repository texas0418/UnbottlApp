import type { ExtractedBeverage } from '@/services/menu-ai';
import type {
  Wine,
  Beer,
  Spirit,
  Cocktail,
  NonAlcoholicBeverage,
  BeerType,
  SpiritType,
  CocktailType,
  NonAlcoholicType,
} from '@/types';

// Convert an AI-extracted menu item into the payload each BeverageContext adder
// expects (everything except the DB-assigned id/createdAt/updatedAt). The AI
// gives us a loosely-typed `beverageType` string and a handful of optional
// fields; we match the string to the closest enum value and default the rest,
// mirroring how the wine path already fills unknown fields. Imported items are
// meant to be reviewed/edited by the owner afterward.

type New<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

const BEER_TYPES: readonly BeerType[] = [
  'lager', 'ale', 'ipa', 'stout', 'porter', 'wheat', 'pilsner', 'sour', 'craft',
];
const SPIRIT_TYPES: readonly SpiritType[] = [
  'whiskey', 'vodka', 'gin', 'rum', 'tequila', 'brandy', 'liqueur', 'mezcal',
];
const COCKTAIL_TYPES: readonly CocktailType[] = [
  'signature', 'classic', 'seasonal', 'mocktail',
];
const NON_ALCOHOLIC_TYPES: readonly NonAlcoholicType[] = [
  'soda', 'juice', 'coffee', 'tea', 'water', 'mocktail', 'other',
];

// Match the AI's free-text type against a known enum, else fall back.
function matchType<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  const v = value.toLowerCase().trim();
  return allowed.find((a) => v === a || v.includes(a)) ?? fallback;
}

const originOf = (item: ExtractedBeverage) => item.country || item.region || '';

export function extractedToWine(item: ExtractedBeverage): New<Wine> {
  return {
    name: item.name,
    producer: item.producer || 'Unknown',
    type: item.wineType || 'red',
    grape: item.grape || '',
    region: item.region || '',
    country: item.country || '',
    vintage: item.vintage ?? null,
    price: item.price ?? 0,
    alcoholContent: 0,
    glassPrice: null,
    description: item.description || '',
    tastingNotes: item.tastingNotes || '',
    pairings: item.pairings || [],
    foodPairings: item.pairings || [],
    flavorProfile: { body: 0, sweetness: 0, tannins: 0, acidity: 0 },
    dietaryTags: [],
    imageUrl: null,
    inStock: true,
    quantity: item.quantity || 1,
    featured: false,
  };
}

export function extractedToBeer(item: ExtractedBeverage): New<Beer> {
  return {
    name: item.name,
    brewery: item.producer || 'Unknown',
    type: matchType(item.beverageType, BEER_TYPES, 'craft'),
    style: item.beverageType || '',
    abv: 0,
    ibu: null,
    origin: originOf(item),
    price: item.price ?? 0,
    servingSize: '',
    description: item.description || '',
    foodPairings: item.pairings || [],
    inStock: true,
    quantity: item.quantity || 1,
    imageUrl: null,
    featured: false,
    beerProfile: { bitterness: 0, maltiness: 0, hoppy: 0, body: 0 },
    dietaryTags: [],
  };
}

export function extractedToSpirit(item: ExtractedBeverage): New<Spirit> {
  return {
    name: item.name,
    brand: item.producer || 'Unknown',
    type: matchType(item.beverageType, SPIRIT_TYPES, 'liqueur'),
    origin: originOf(item),
    age: null,
    abv: 0,
    price: item.price ?? 0,
    shotPrice: null,
    description: item.description || '',
    mixers: [],
    inStock: true,
    quantity: item.quantity || 1,
    imageUrl: null,
    featured: false,
    spiritProfile: { smoothness: 0, complexity: 0, sweetness: 0, intensity: 0 },
    dietaryTags: [],
  };
}

export function extractedToCocktail(item: ExtractedBeverage): New<Cocktail> {
  return {
    name: item.name,
    type: matchType(item.beverageType, COCKTAIL_TYPES, 'classic'),
    baseSpirit: '',
    ingredients: [],
    garnish: '',
    glassType: '',
    price: item.price ?? 0,
    description: item.description || '',
    isSignature: false,
    isAvailable: true,
    imageUrl: null,
    featured: false,
    dietaryTags: [],
  };
}

export function extractedToNonAlcoholic(item: ExtractedBeverage): New<NonAlcoholicBeverage> {
  return {
    name: item.name,
    brand: item.producer || null,
    type: matchType(item.beverageType, NON_ALCOHOLIC_TYPES, 'other'),
    description: item.description || '',
    price: item.price ?? 0,
    servingSize: '',
    calories: null,
    ingredients: [],
    inStock: true,
    quantity: item.quantity || 1,
    imageUrl: null,
    featured: false,
    dietaryTags: [],
  };
}
