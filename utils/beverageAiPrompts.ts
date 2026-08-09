import type { BeverageCategory } from '@/types';
import type {
  WineFormValues,
  BeerFormValues,
  SpiritFormValues,
  CocktailFormValues,
  NonAlcoholicFormValues,
} from './beverageFormPayloads';

// AI prompt copy for the "add beverage" screen, kept out of the component so
// the handlers stay thin and the wording is editable in one place.
//
// Each builder returns either the prompt to send, or the message to show when
// the user hasn't entered enough detail yet.

export interface PromptForms {
  wine: WineFormValues;
  beer: BeerFormValues;
  spirit: SpiritFormValues;
  cocktail: CocktailFormValues;
  nonAlcoholic: NonAlcoholicFormValues;
  ingredients: string[];
}

export type PromptResult = { prompt: string; error?: undefined } | { error: string; prompt?: undefined };

const PAIRING_FORMAT =
  'Return ONLY a comma-separated list of short food names (2-4 words each), no numbering, no explanations.';

type Builder = (f: PromptForms) => PromptResult;

const descriptionBuilders: Record<BeverageCategory, Builder> = {
  wine: ({ wine }) =>
    !wine.name && !wine.grape && !wine.type
      ? { error: 'Please add wine details first.' }
      : {
          prompt: `Write a brief tasting note (2-3 sentences) for: ${wine.name || 'Unknown'} ${wine.type} wine from ${wine.region || 'Unknown'}, ${wine.country || 'Unknown'}. Grape: ${wine.grape || 'Unknown'}. Describe aromas and flavors.`,
        },
  beer: ({ beer }) =>
    !beer.name && !beer.type
      ? { error: 'Please add beer details first.' }
      : {
          prompt: `Write a brief description (2-3 sentences) for: ${beer.name || 'Unknown'} ${beer.type} ${beer.style || ''} from ${beer.brewery || 'Unknown'}. ABV: ${beer.abv || 'Unknown'}%. Describe taste and character.`,
        },
  spirit: ({ spirit }) =>
    !spirit.name && !spirit.type
      ? { error: 'Please add spirit details first.' }
      : {
          prompt: `Write a brief tasting note (2-3 sentences) for: ${spirit.name || 'Unknown'} ${spirit.type} from ${spirit.origin || 'Unknown'}. Age: ${spirit.age || 'Unaged'}. Describe nose, palate, and finish.`,
        },
  cocktail: ({ cocktail, ingredients }) =>
    !cocktail.name
      ? { error: 'Please add cocktail name first.' }
      : {
          prompt: `Write a brief enticing description (2-3 sentences) for a cocktail called "${cocktail.name}" made with ${cocktail.baseSpirit || 'spirits'}. Ingredients: ${ingredients.join(', ') || 'various'}. Make it sound appealing.`,
        },
  'non-alcoholic': ({ nonAlcoholic }) =>
    !nonAlcoholic.name
      ? { error: 'Please add beverage name first.' }
      : {
          prompt: `Write a brief description (2-3 sentences) for: ${nonAlcoholic.name || 'Unknown'} (${nonAlcoholic.type}). Make it sound refreshing and appealing.`,
        },
};

const pairingBuilders: Record<BeverageCategory, Builder> = {
  wine: ({ wine }) =>
    !wine.name && !wine.grape && !wine.type
      ? { error: 'Please add wine details first so we can suggest pairings.' }
      : {
          prompt: `Suggest exactly 5 specific food pairings for: ${wine.name || 'a'} ${wine.type} wine${wine.grape ? ` made from ${wine.grape}` : ''}${wine.region ? ` from ${wine.region}` : ''}. ${PAIRING_FORMAT} Example format: Grilled Ribeye, Aged Gouda, Mushroom Risotto, Dark Chocolate, Lamb Chops`,
        },
  beer: ({ beer }) =>
    !beer.name && !beer.type
      ? { error: 'Please add beer details first so we can suggest pairings.' }
      : {
          prompt: `Suggest exactly 5 specific food pairings for: ${beer.name || 'a'} ${beer.type} ${beer.style || 'beer'}${beer.brewery ? ` from ${beer.brewery}` : ''}. ${PAIRING_FORMAT} Example format: BBQ Ribs, Fish Tacos, Pretzels, Spicy Wings, Cheddar Cheese`,
        },
  spirit: ({ spirit }) =>
    !spirit.name && !spirit.type
      ? { error: 'Please add spirit details first so we can suggest pairings.' }
      : {
          prompt: `Suggest exactly 5 specific food pairings for: ${spirit.name || 'a'} ${spirit.type}${spirit.origin ? ` from ${spirit.origin}` : ''}${spirit.age ? `, aged ${spirit.age}` : ''}. ${PAIRING_FORMAT} Example format: Dark Chocolate, Smoked Salmon, Blue Cheese, Grilled Peaches, Charcuterie`,
        },
  cocktail: ({ cocktail, ingredients }) =>
    !cocktail.name
      ? { error: 'Please add cocktail name first so we can suggest pairings.' }
      : {
          prompt: `Suggest exactly 5 specific food pairings for a cocktail called "${cocktail.name}"${cocktail.baseSpirit ? ` made with ${cocktail.baseSpirit}` : ''}${ingredients.length > 0 ? `, ingredients: ${ingredients.join(', ')}` : ''}. ${PAIRING_FORMAT} Example format: Shrimp Ceviche, Bruschetta, Oysters, Spicy Tuna Roll, Caprese Salad`,
        },
  'non-alcoholic': ({ nonAlcoholic }) =>
    !nonAlcoholic.name
      ? { error: 'Please add beverage name first so we can suggest pairings.' }
      : {
          prompt: `Suggest exactly 5 specific food pairings for: ${nonAlcoholic.name || 'a'} (${nonAlcoholic.type} beverage). ${PAIRING_FORMAT} Example format: Croissant, Fruit Tart, Granola Bowl, Scones, Avocado Toast`,
        },
};

export function buildDescriptionPrompt(category: BeverageCategory, forms: PromptForms): PromptResult {
  return descriptionBuilders[category](forms);
}

export function buildPairingsPrompt(category: BeverageCategory, forms: PromptForms): PromptResult {
  return pairingBuilders[category](forms);
}
