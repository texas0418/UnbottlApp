/**
 * AI Menu Analysis Service
 * 
 * This service analyzes menu images and extracts beverage information.
 * It can use OpenAI's Vision API, Google's Gemini, or a mock implementation.
 * 
 * To use with a real AI API:
 * 1. Set EXPO_PUBLIC_OPENAI_API_KEY in your environment
 * 2. Or set EXPO_PUBLIC_GOOGLE_AI_API_KEY for Gemini
 */

import { WineType } from '@/types';

export interface ExtractedBeverage {
  id: string;
  name: string;
  category: 'wine' | 'beer' | 'spirit' | 'cocktail' | 'non-alcoholic';
  price?: number;
  description?: string;
  producer?: string;
  region?: string;
  country?: string;
  vintage?: number;
  grape?: string;
  wineType?: WineType;
  beverageType?: string;
  tastingNotes?: string;
  pairings?: string[];
  quantity?: number;
  confidence?: number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// OpenAI Vision API prompt for menu analysis
const MENU_ANALYSIS_PROMPT = `Analyze this menu image and extract all beverages (wines, beers, spirits, cocktails, non-alcoholic drinks).

For each beverage found, provide:
- name: The full name of the beverage
- category: One of "wine", "beer", "spirit", "cocktail", or "non-alcoholic"
- price: The price if visible (number only, no currency symbol)
- producer: The producer/winery/brewery if mentioned
- description: Any description or tasting notes
- region: The region if mentioned (for wines)
- country: The country of origin if mentioned
- vintage: The year if mentioned (for wines)
- grape: The grape variety if mentioned (for wines)
- wineType: For wines only - one of "red", "white", "rose", "sparkling", "dessert", "fortified"
- beverageType: For non-wines - the specific type (e.g., "IPA", "Vodka", "Margarita")

Return the results as a JSON array. Be thorough and extract ALL beverages visible in the menu.
If you're uncertain about a field, omit it rather than guessing.

Example output format:
[
  {
    "name": "Chateau Margaux 2015",
    "category": "wine",
    "price": 450,
    "producer": "Chateau Margaux",
    "region": "Bordeaux",
    "country": "France",
    "vintage": 2015,
    "grape": "Cabernet Sauvignon",
    "wineType": "red",
    "description": "Full-bodied with notes of blackcurrant and cedar"
  }
]`;

/**
 * Analyze a menu image using AI and extract beverages
 */
export async function analyzeMenuImage(
  imageUri: string,
  base64Data?: string
): Promise<ExtractedBeverage[]> {
  // Check for API keys
  const openAIKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const googleAIKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;

  if (openAIKey) {
    return analyzeWithOpenAI(base64Data || '', openAIKey);
  } else if (googleAIKey) {
    return analyzeWithGemini(base64Data || '', googleAIKey);
  } else {
    // Use mock implementation for development/demo
    console.log('No AI API key found, using mock implementation');
    return mockAnalyzeMenu(imageUri);
  }
}

/**
 * Analyze menu using OpenAI's Vision API
 */
async function analyzeWithOpenAI(
  base64Data: string,
  apiKey: string
): Promise<ExtractedBeverage[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: MENU_ANALYSIS_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse beverage list from response');
    }

    const beverages = JSON.parse(jsonMatch[0]);
    
    return beverages.map((item: any) => ({
      ...item,
      id: generateId(),
      confidence: 0.9 + Math.random() * 0.1, // High confidence for real AI
    }));
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw error;
  }
}

/**
 * Analyze menu using Google's Gemini API
 */
async function analyzeWithGemini(
  base64Data: string,
  apiKey: string
): Promise<ExtractedBeverage[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: MENU_ANALYSIS_PROMPT },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse beverage list from response');
    }

    const beverages = JSON.parse(jsonMatch[0]);
    
    return beverages.map((item: any) => ({
      ...item,
      id: generateId(),
      confidence: 0.85 + Math.random() * 0.15,
    }));
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw error;
  }
}

/**
 * Mock menu analysis for development/demo purposes
 * Simulates AI extraction with realistic sample data
 */
async function mockAnalyzeMenu(imageUri: string): Promise<ExtractedBeverage[]> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

  // Return mock extracted beverages
  const mockBeverages: ExtractedBeverage[] = [
    {
      id: generateId(),
      name: 'Caymus Cabernet Sauvignon',
      category: 'wine',
      wineType: 'red',
      price: 85,
      producer: 'Caymus Vineyards',
      region: 'Napa Valley',
      country: 'USA',
      vintage: 2021,
      grape: 'Cabernet Sauvignon',
      description: 'Rich and velvety with dark fruit flavors',
      tastingNotes: 'Blackberry, cassis, vanilla, oak',
      confidence: 0.95,
    },
    {
      id: generateId(),
      name: 'Whispering Angel Rosé',
      category: 'wine',
      wineType: 'rose',
      price: 52,
      producer: 'Caves d\'Esclans',
      region: 'Provence',
      country: 'France',
      vintage: 2023,
      grape: 'Grenache, Cinsault',
      description: 'Pale pink with delicate fruit notes',
      confidence: 0.92,
    },
    {
      id: generateId(),
      name: 'Veuve Clicquot Yellow Label',
      category: 'wine',
      wineType: 'sparkling',
      price: 75,
      producer: 'Veuve Clicquot',
      region: 'Champagne',
      country: 'France',
      description: 'Classic champagne with fine bubbles',
      confidence: 0.98,
    },
    {
      id: generateId(),
      name: 'Cloudy Bay Sauvignon Blanc',
      category: 'wine',
      wineType: 'white',
      price: 48,
      producer: 'Cloudy Bay',
      region: 'Marlborough',
      country: 'New Zealand',
      vintage: 2023,
      grape: 'Sauvignon Blanc',
      description: 'Crisp and zesty with citrus notes',
      confidence: 0.91,
    },
    {
      id: generateId(),
      name: 'Lagunitas IPA',
      category: 'beer',
      beverageType: 'IPA',
      price: 8,
      producer: 'Lagunitas Brewing',
      country: 'USA',
      description: 'Hop-forward with citrus and pine',
      confidence: 0.88,
    },
    {
      id: generateId(),
      name: 'Stella Artois',
      category: 'beer',
      beverageType: 'Pilsner',
      price: 7,
      producer: 'AB InBev',
      country: 'Belgium',
      description: 'Classic European pilsner',
      confidence: 0.94,
    },
    {
      id: generateId(),
      name: 'Classic Margarita',
      category: 'cocktail',
      beverageType: 'Margarita',
      price: 14,
      description: 'Tequila, lime, triple sec, salted rim',
      confidence: 0.89,
    },
    {
      id: generateId(),
      name: 'Old Fashioned',
      category: 'cocktail',
      beverageType: 'Whiskey Cocktail',
      price: 16,
      description: 'Bourbon, bitters, sugar, orange peel',
      confidence: 0.93,
    },
    {
      id: generateId(),
      name: 'Grey Goose Vodka',
      category: 'spirit',
      beverageType: 'Vodka',
      price: 14,
      producer: 'Grey Goose',
      country: 'France',
      description: 'Premium French vodka',
      confidence: 0.96,
    },
    {
      id: generateId(),
      name: 'Macallan 12 Year',
      category: 'spirit',
      beverageType: 'Single Malt Scotch',
      price: 18,
      producer: 'The Macallan',
      country: 'Scotland',
      description: 'Sherry oak matured single malt',
      confidence: 0.97,
    },
    {
      id: generateId(),
      name: 'San Pellegrino',
      category: 'non-alcoholic',
      beverageType: 'Sparkling Water',
      price: 5,
      producer: 'San Pellegrino',
      country: 'Italy',
      description: 'Premium Italian sparkling mineral water',
      confidence: 0.99,
    },
    {
      id: generateId(),
      name: 'Fresh Lemonade',
      category: 'non-alcoholic',
      beverageType: 'Juice',
      price: 6,
      description: 'House-made with fresh lemons and mint',
      confidence: 0.87,
    },
  ];

  // Return a random subset to simulate different menus
  const shuffled = mockBeverages.sort(() => 0.5 - Math.random());
  const count = 5 + Math.floor(Math.random() * 8);
  return shuffled.slice(0, count);
}

/**
 * Validate and clean extracted beverage data
 */
export function validateExtractedBeverage(item: Partial<ExtractedBeverage>): ExtractedBeverage | null {
  if (!item.name || !item.category) {
    return null;
  }

  return {
    id: item.id || generateId(),
    name: item.name.trim(),
    category: item.category,
    price: item.price && item.price > 0 ? item.price : undefined,
    description: item.description?.trim(),
    producer: item.producer?.trim(),
    region: item.region?.trim(),
    country: item.country?.trim(),
    vintage: item.vintage && item.vintage > 1900 && item.vintage <= new Date().getFullYear() + 1 
      ? item.vintage 
      : undefined,
    grape: item.grape?.trim(),
    wineType: item.wineType,
    beverageType: item.beverageType?.trim(),
    tastingNotes: item.tastingNotes?.trim(),
    pairings: item.pairings,
    quantity: item.quantity || 1,
    confidence: item.confidence,
  };
}
