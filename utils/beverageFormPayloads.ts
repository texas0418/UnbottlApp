import type {
  Wine,
  Beer,
  Spirit,
  Cocktail,
  NonAlcoholicBeverage,
  WineType,
  BeerType,
  SpiritType,
  CocktailType,
  NonAlcoholicType,
} from '@/types';

// Pure translation of the "add beverage" form state (all strings, as typed by
// the user) into the payload each BeverageContext adder expects. Kept out of
// the screen so the submit handler stays a thin validate-and-dispatch.

type New<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export interface WineFormValues {
  name: string; producer: string; type: WineType; vintage: string; region: string;
  country: string; grape: string; alcoholContent: string; price: string;
  glassPrice: string; tastingNotes: string; quantity: string; imageUrl: string;
}
export interface BeerFormValues {
  name: string; brewery: string; type: BeerType; style: string; abv: string; ibu: string;
  origin: string; price: string; servingSize: string; description: string;
  quantity: string; imageUrl: string;
}
export interface SpiritFormValues {
  name: string; brand: string; type: SpiritType; origin: string; age: string; abv: string;
  price: string; shotPrice: string; description: string; quantity: string; imageUrl: string;
}
export interface CocktailFormValues {
  name: string; type: CocktailType; baseSpirit: string; garnish: string; glassType: string;
  price: string; description: string; isSignature: boolean; imageUrl: string;
}
export interface NonAlcoholicFormValues {
  name: string; brand: string; type: NonAlcoholicType; description: string; price: string;
  servingSize: string; calories: string; quantity: string; imageUrl: string;
}

const num = (v: string) => parseFloat(v) || 0;
const int = (v: string) => parseInt(v, 10) || 0;
const optNum = (v: string) => (v ? parseFloat(v) : null);
const optInt = (v: string) => (v ? parseInt(v, 10) : null);
const optText = (v: string) => v.trim() || null;

/** Returns an error message when any required field is blank, else null. */
export function missingFieldsMessage(values: string[], message: string): string | null {
  return values.some((v) => !v.trim()) ? message : null;
}

export function buildWinePayload(
  f: WineFormValues, foodPairings: string[], featured: boolean,
): New<Wine> {
  return {
    name: f.name.trim(), producer: f.producer.trim(), type: f.type,
    vintage: optInt(f.vintage), region: f.region.trim(), country: f.country.trim(),
    grape: f.grape.trim(), alcoholContent: num(f.alcoholContent), price: num(f.price),
    glassPrice: optNum(f.glassPrice), tastingNotes: f.tastingNotes.trim(),
    foodPairings, inStock: true, quantity: int(f.quantity),
    imageUrl: optText(f.imageUrl), featured,
    flavorProfile: { body: 3, sweetness: 2, tannins: 3, acidity: 3 }, dietaryTags: [],
  };
}

export function buildBeerPayload(
  f: BeerFormValues, foodPairings: string[], featured: boolean,
): New<Beer> {
  return {
    name: f.name.trim(), brewery: f.brewery.trim(), type: f.type, style: f.style.trim(),
    abv: num(f.abv), ibu: optInt(f.ibu), origin: f.origin.trim(), price: num(f.price),
    servingSize: f.servingSize.trim(), description: f.description.trim(),
    foodPairings, inStock: true, quantity: int(f.quantity),
    imageUrl: optText(f.imageUrl), featured,
    beerProfile: { bitterness: 3, maltiness: 3, hoppy: 3, body: 3 }, dietaryTags: [],
  };
}

export function buildSpiritPayload(
  f: SpiritFormValues, mixers: string[], featured: boolean,
): New<Spirit> {
  return {
    name: f.name.trim(), brand: f.brand.trim(), type: f.type, origin: f.origin.trim(),
    age: optText(f.age), abv: num(f.abv), price: num(f.price), shotPrice: optNum(f.shotPrice),
    description: f.description.trim(), mixers, inStock: true, quantity: int(f.quantity),
    imageUrl: optText(f.imageUrl), featured,
    spiritProfile: { smoothness: 3, complexity: 3, sweetness: 2, intensity: 3 }, dietaryTags: [],
  };
}

export function buildCocktailPayload(
  f: CocktailFormValues, ingredients: string[], featured: boolean,
): New<Cocktail> {
  return {
    name: f.name.trim(), type: f.type, baseSpirit: f.baseSpirit.trim(), ingredients,
    garnish: f.garnish.trim(), glassType: f.glassType.trim(), price: num(f.price),
    description: f.description.trim(), isSignature: f.isSignature, isAvailable: true,
    imageUrl: optText(f.imageUrl), featured, dietaryTags: [],
  };
}

export function buildNonAlcoholicPayload(
  f: NonAlcoholicFormValues, ingredients: string[], featured: boolean,
): New<NonAlcoholicBeverage> {
  return {
    name: f.name.trim(), brand: optText(f.brand), type: f.type,
    description: f.description.trim(), price: num(f.price),
    servingSize: f.servingSize.trim(), calories: optInt(f.calories), ingredients,
    inStock: true, quantity: int(f.quantity), imageUrl: optText(f.imageUrl),
    featured, dietaryTags: [],
  };
}
