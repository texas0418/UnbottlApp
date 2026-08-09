import type {
  Wine,
  Beer,
  Spirit,
  Cocktail,
  NonAlcoholicBeverage,
} from '@/types';

// Pure translation of one parsed CSV row (all values strings, keys lowercased
// by the importer) into the payload each BeverageContext adder expects.
// Kept out of the screen so the import handler stays a thin dispatch.

type New<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
type Row = Record<string, string>;

/** Pipe-separated CSV list column -> array. */
const list = (v: string | undefined): string[] => (v ? v.split('|') : []);
/** CSV booleans are opt-in: anything other than "true" is false. */
const isTrue = (v: string | undefined): boolean => v?.toLowerCase() === 'true';
/** Some columns default to true instead, so only an explicit "false" turns them off. */
const isNotFalse = (v: string | undefined): boolean => v?.toLowerCase() !== 'false';
const numOr = (v: string | undefined, fallback: number): number => parseFloat(v ?? '') || fallback;
const intOr = (v: string | undefined, fallback: number): number => parseInt(v ?? '', 10) || fallback;
const optNum = (v: string | undefined): number | null => (v ? parseFloat(v) : null);
const optInt = (v: string | undefined): number | null => (v ? parseInt(v, 10) : null);

export function csvRowToWine(data: Row): New<Wine> {
  return {
    name: data.name,
    producer: data.producer,
    type: data.type as Wine['type'],
    vintage: optInt(data.vintage),
    region: data.region || '',
    country: data.country || '',
    grape: data.grape || '',
    alcoholContent: numOr(data.alcoholcontent, 13),
    price: numOr(data.price, 0),
    glassPrice: optNum(data.glassprice),
    tastingNotes: data.tastingnotes || '',
    foodPairings: list(data.foodpairings),
    quantity: intOr(data.quantity, 0),
    inStock: isTrue(data.instock),
    featured: isTrue(data.featured),
    imageUrl: null,
    flavorProfile: { body: 3, sweetness: 2, tannins: 3, acidity: 3 },
    dietaryTags: [],
  };
}

export function csvRowToBeer(data: Row): New<Beer> {
  return {
    name: data.name,
    brewery: data.brewery,
    type: data.type as Beer['type'],
    style: data.style || '',
    abv: numOr(data.abv, 5),
    ibu: optInt(data.ibu),
    origin: data.origin || '',
    price: numOr(data.price, 0),
    servingSize: data.servingsize || '12oz',
    description: data.description || '',
    foodPairings: list(data.foodpairings),
    quantity: intOr(data.quantity, 0),
    inStock: isTrue(data.instock),
    featured: isTrue(data.featured),
    imageUrl: null,
    beerProfile: { bitterness: 3, maltiness: 3, hoppy: 3, body: 3 },
    dietaryTags: [],
  };
}

export function csvRowToSpirit(data: Row): New<Spirit> {
  return {
    name: data.name,
    brand: data.brand,
    type: data.type as Spirit['type'],
    origin: data.origin || '',
    age: data.age || null,
    abv: numOr(data.abv, 40),
    price: numOr(data.price, 0),
    shotPrice: optNum(data.shotprice),
    description: data.description || '',
    mixers: list(data.mixers),
    quantity: intOr(data.quantity, 0),
    inStock: isTrue(data.instock),
    featured: isTrue(data.featured),
    imageUrl: null,
    spiritProfile: { smoothness: 3, complexity: 3, sweetness: 2, intensity: 3 },
    dietaryTags: [],
  };
}

export function csvRowToCocktail(data: Row): New<Cocktail> {
  return {
    name: data.name,
    type: data.type as Cocktail['type'],
    baseSpirit: data.basespirit,
    ingredients: list(data.ingredients),
    garnish: data.garnish || '',
    glassType: data.glasstype || 'Rocks',
    price: numOr(data.price, 0),
    description: data.description || '',
    isSignature: isTrue(data.issignature),
    isAvailable: isNotFalse(data.isavailable),
    featured: isTrue(data.featured),
    imageUrl: null,
    dietaryTags: [],
  };
}

export function csvRowToNonAlcoholic(data: Row): New<NonAlcoholicBeverage> {
  return {
    name: data.name,
    brand: data.brand || null,
    type: data.type as NonAlcoholicBeverage['type'],
    description: data.description || '',
    price: numOr(data.price, 0),
    servingSize: data.servingsize || '12oz',
    calories: optInt(data.calories),
    ingredients: list(data.ingredients),
    quantity: intOr(data.quantity, 0),
    inStock: isNotFalse(data.instock),
    featured: isTrue(data.featured),
    imageUrl: null,
    dietaryTags: [],
  };
}
