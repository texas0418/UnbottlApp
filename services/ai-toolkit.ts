/**
 * AI Toolkit Service
 * 
 * Provides AI implementations for the Unbottl app using OpenAI.
 * Set EXPO_PUBLIC_OPENAI_API_KEY in your environment to enable.
 * Falls back to mock implementations if no API key is provided.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface ToolConfig<T = any> {
  description: string;
  zodSchema: z.ZodType<T>;
  execute: (input: T) => string | Promise<string>;
}

export type AgentStatus = 'idle' | 'submitted' | 'streaming' | 'error';

export interface UseAgentOptions {
  tools?: Record<string, ToolConfig>;
  systemPrompt?: string;
}

export interface UseAgentReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  status: AgentStatus;
  error?: Error;
  clearMessages: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Check for OpenAI API key
const getOpenAIKey = () => process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * Generate text using OpenAI
 * This is the main function used for generating tasting notes, descriptions, etc.
 */
export async function generateText(prompt: string): Promise<string> {
  const apiKey = getOpenAIKey();
  
  if (apiKey) {
    return generateTextWithOpenAI(prompt, apiKey);
  } else {
    console.log('No OpenAI API key found, using mock implementation');
    return generateTextMock(prompt);
  }
}

/**
 * Generate text using OpenAI API
 */
async function generateTextWithOpenAI(prompt: string, apiKey: string): Promise<string> {
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
            role: 'system',
            content: 'You are an expert sommelier and beverage specialist. Provide concise, professional, and engaging descriptions. Keep responses to 2-3 sentences unless asked for more detail.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
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

    return content.trim();
  } catch (error) {
    console.error('OpenAI generateText error:', error);
    throw error;
  }
}

/**
 * Mock text generation for development
 */
async function generateTextMock(prompt: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

  const lowerPrompt = prompt.toLowerCase();

  // Wine descriptions
  if (lowerPrompt.includes('wine') && lowerPrompt.includes('tasting')) {
    const wineNotes = [
      'This elegant wine opens with aromas of dark cherry and cassis, leading to a palate of ripe plum, vanilla, and subtle oak. The finish is long and silky with well-integrated tannins.',
      'Vibrant and expressive, this wine displays notes of citrus zest, white peach, and hints of honeysuckle. The crisp acidity and mineral undertones create a refreshing, balanced finish.',
      'A sophisticated blend featuring layers of blackberry, mocha, and dried herbs. The full body and velvety texture give way to a lingering finish of spice and dark chocolate.',
      'Bright and aromatic with fresh strawberry, rose petal, and a touch of citrus. The palate is crisp and refreshing with a clean, elegant finish perfect for warm evenings.',
    ];
    return wineNotes[Math.floor(Math.random() * wineNotes.length)];
  }

  // Beer descriptions
  if (lowerPrompt.includes('beer') || lowerPrompt.includes('brewery')) {
    const beerNotes = [
      'Bold hop character with notes of grapefruit and pine, balanced by a solid malt backbone. The finish is crisp with lingering citrus bitterness that invites another sip.',
      'Rich and creamy with flavors of roasted coffee, dark chocolate, and caramel. The smooth mouthfeel and subtle sweetness make this an exceptionally drinkable stout.',
      'Bright and refreshing with subtle wheat notes and hints of banana and clove from traditional yeast. Light-bodied and perfect for any occasion.',
    ];
    return beerNotes[Math.floor(Math.random() * beerNotes.length)];
  }

  // Spirit descriptions
  if (lowerPrompt.includes('spirit') || lowerPrompt.includes('whiskey') || lowerPrompt.includes('vodka') || lowerPrompt.includes('gin') || lowerPrompt.includes('rum') || lowerPrompt.includes('tequila')) {
    const spiritNotes = [
      'On the nose, rich caramel and vanilla lead to warm baking spices. The palate reveals layers of honey, oak, and dried fruit, finishing with a gentle warmth and lingering sweetness.',
      'Crystal clear with exceptional smoothness. Subtle notes of grain and a hint of citrus create a clean, refined profile perfect for sipping or mixing.',
      'Aromatic botanicals including juniper, coriander, and citrus peel create a complex yet balanced spirit. The finish is crisp with herbal undertones.',
    ];
    return spiritNotes[Math.floor(Math.random() * spiritNotes.length)];
  }

  // Cocktail descriptions
  if (lowerPrompt.includes('cocktail')) {
    const cocktailNotes = [
      'A masterful balance of bold and refreshing, this cocktail combines premium spirits with fresh citrus and aromatic bitters. The perfect introduction to an evening of sophistication.',
      'Vibrant and Instagram-worthy, this signature creation features house-made syrups and fresh seasonal ingredients. Each sip reveals new layers of flavor.',
      'Classic meets contemporary in this reimagined favorite. Smooth, aromatic, and perfectly balanced with a memorable finish.',
    ];
    return cocktailNotes[Math.floor(Math.random() * cocktailNotes.length)];
  }

  // Non-alcoholic descriptions
  if (lowerPrompt.includes('non-alcoholic') || lowerPrompt.includes('mocktail') || lowerPrompt.includes('juice') || lowerPrompt.includes('coffee') || lowerPrompt.includes('tea')) {
    const naDescriptions = [
      'Refreshing and invigorating with bright natural flavors. Perfect for those seeking a sophisticated alcohol-free option without compromising on taste.',
      'Crafted with care using premium ingredients, this beverage offers complex flavors and a satisfying finish that rivals any cocktail.',
      'A delightful blend of fresh, natural ingredients creating a refreshing and revitalizing experience. Served chilled for maximum enjoyment.',
    ];
    return naDescriptions[Math.floor(Math.random() * naDescriptions.length)];
  }

  // Generic fallback
  return 'A carefully crafted beverage featuring premium ingredients and expert preparation. The balanced flavor profile and smooth finish make this a standout choice.';
}

// Mock responses for sommelier chat (used when no API key)
const SOMMELIER_RESPONSES = [
  "Based on your preferences, I'd recommend trying our Pinot Noir Reserve. It's an elegant medium-bodied red that pairs wonderfully with grilled salmon or roasted chicken.",
  "For what you're looking for, our Sauvignon Blanc would be perfect. It offers crisp citrus notes with hints of green apple. It's particularly delightful when paired with seafood.",
  "I think you'll love our Cabernet Sauvignon! It's bold and full-bodied with a beautiful lingering finish. This one is a staff favorite and goes excellently with steak.",
];

// Wine scanner mock responses
const WINE_SCANNER_RESPONSES = [
  {
    name: "Château Margaux 2015",
    producer: "Château Margaux",
    type: "red",
    region: "Margaux, Bordeaux",
    country: "France",
    vintage: 2015,
    grape: "Cabernet Sauvignon blend"
  },
  {
    name: "Opus One 2018",
    producer: "Opus One Winery",
    type: "red",
    region: "Napa Valley",
    country: "USA",
    vintage: 2018,
    grape: "Cabernet Sauvignon blend"
  },
  {
    name: "Cloudy Bay Sauvignon Blanc 2022",
    producer: "Cloudy Bay",
    type: "white",
    region: "Marlborough",
    country: "New Zealand",
    vintage: 2022,
    grape: "Sauvignon Blanc"
  },
];

export function createRorkTool<T>(config: ToolConfig<T>): ToolConfig<T> {
  return config;
}

export function useRorkAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [error, setError] = useState<Error | undefined>();
  const conversationRef = useRef<Message[]>([]);

  // Generate response using OpenAI or fallback to mock
  const generateResponse = useCallback(async (userMessage: string, history: Message[]): Promise<string> => {
    const apiKey = getOpenAIKey();
    
    if (apiKey) {
      return generateChatResponseWithOpenAI(userMessage, history, options.systemPrompt, apiKey);
    } else {
      return generateMockResponse(userMessage);
    }
  }, [options.systemPrompt]);

  const generateMockResponse = useCallback((userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('mood')) {
      return SOMMELIER_RESPONSES[Math.floor(Math.random() * SOMMELIER_RESPONSES.length)];
    }

    if (lowerMessage.includes('pair') || lowerMessage.includes('steak') || lowerMessage.includes('seafood')) {
      return "For that dish, I'd suggest our Cabernet Sauvignon. Its bold tannins and dark fruit notes complement the rich flavors perfectly.";
    }

    if (lowerMessage.includes('sweet') || lowerMessage.includes('dessert')) {
      return "For something sweet, our Late Harvest Riesling is exceptional - it has notes of honey, apricot, and citrus with just the right balance of sweetness.";
    }

    if (lowerMessage.includes('non-alcoholic') || lowerMessage.includes('mocktail')) {
      return "We have several delightful non-alcoholic options! Our house-made Sparkling Elderflower Lemonade is refreshing and sophisticated.";
    }

    if (lowerMessage.includes('beer') || lowerMessage.includes('craft')) {
      return "For beer lovers, I'd recommend our local IPA - it has wonderful hop character with citrus notes. If you prefer something lighter, our house pilsner is crisp and refreshing.";
    }

    if (lowerMessage.includes('cocktail') || lowerMessage.includes('mixed drink')) {
      return "Our signature cocktail, the 'Garden Mule,' is a guest favorite - it's a refreshing twist on the classic with cucumber and fresh herbs. For something classic, our Old Fashioned is expertly crafted.";
    }

    return "I'd be happy to help you find the perfect beverage! Could you tell me more about what you're in the mood for, or what you'll be eating?";
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    conversationRef.current = [...conversationRef.current, userMessage];
    setStatus('submitted');

    try {
      // Simulate initial processing
      await new Promise(resolve => setTimeout(resolve, 300));
      setStatus('streaming');

      // Generate response
      const responseText = await generateResponse(content, conversationRef.current);

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      conversationRef.current = [...conversationRef.current, assistantMessage];
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setStatus('error');
    }
  }, [generateResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationRef.current = [];
    setStatus('idle');
    setError(undefined);
  }, []);

  return {
    messages,
    sendMessage,
    status,
    error,
    clearMessages
  };
}

/**
 * Generate chat response using OpenAI
 */
async function generateChatResponseWithOpenAI(
  userMessage: string,
  history: Message[],
  systemPrompt: string | undefined,
  apiKey: string
): Promise<string> {
  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system prompt
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    } else {
      messages.push({
        role: 'system',
        content: `You are an expert AI sommelier helping customers find the perfect beverage. 
You have deep knowledge of wines, beers, spirits, cocktails, and non-alcoholic drinks.
Be warm, conversational, and helpful. Provide 2-3 specific recommendations when asked.
Keep responses concise but informative.`,
      });
    }

    // Add conversation history (limit to last 10 messages to stay within token limits)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
        temperature: 0.8,
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

    return content.trim();
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw error;
  }
}

export interface GenerateObjectOptions<T = any> {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: any }>;
  schema?: z.ZodType<T>;
}

/**
 * Generate structured object using AI (for wine scanning, etc.)
 */
export async function generateObject<T = any>(options: GenerateObjectOptions<T>): Promise<{ object: T }> {
  const apiKey = getOpenAIKey();
  
  if (apiKey) {
    return generateObjectWithOpenAI(options, apiKey);
  } else {
    return generateObjectMock(options);
  }
}

/**
 * Generate object using OpenAI
 */
async function generateObjectWithOpenAI<T>(
  options: GenerateObjectOptions<T>,
  apiKey: string
): Promise<{ object: T }> {
  try {
    const userMessage = options.messages.find(m => m.role === 'user');
    const imageContent = userMessage?.content?.find?.((c: any) => c.type === 'image_url');
    const textContent = userMessage?.content?.find?.((c: any) => c.type === 'text')?.text || '';

    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert wine and beverage analyst. Analyze the provided information and return a JSON object with the beverage details. Always respond with valid JSON only, no additional text.`,
      },
    ];

    if (imageContent) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: textContent || 'Analyze this wine label and extract all information. Return as JSON with fields: name, producer, type, vintage, region, country, grape, alcoholContent, tastingNotes, foodPairings (array), estimatedPrice, flavorProfile (object with sweetness, acidity, tannin, body, alcohol as numbers 1-10).',
          },
          imageContent,
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: textContent,
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.3,
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

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { object: parsed as T };
  } catch (error) {
    console.error('OpenAI generateObject error:', error);
    throw error;
  }
}

/**
 * Mock object generation
 */
async function generateObjectMock<T>(options: GenerateObjectOptions<T>): Promise<{ object: T }> {
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

  const userMessage = options.messages.find(m => m.role === 'user');
  const textContent = userMessage?.content?.find?.((c: any) => c.type === 'text')?.text || '';

  if (textContent.toLowerCase().includes('wine') && textContent.toLowerCase().includes('label')) {
    const wineData = WINE_SCANNER_RESPONSES[Math.floor(Math.random() * WINE_SCANNER_RESPONSES.length)];
    return {
      object: {
        name: wineData.name,
        producer: wineData.producer,
        type: wineData.type,
        vintage: wineData.vintage,
        region: wineData.region,
        country: wineData.country,
        grape: wineData.grape,
        alcoholContent: 13.5,
        tastingNotes: "Rich and complex with notes of dark fruit, vanilla, and subtle oak.",
        foodPairings: ["Grilled steak", "Lamb chops", "Hard aged cheese"],
        estimatedPrice: 45,
        flavorProfile: {
          sweetness: 2,
          acidity: 6,
          tannin: 7,
          body: 8,
          alcohol: 7,
        },
      } as T,
    };
  }

  return {
    object: {
      analyzed: true,
      message: "Analysis complete",
    } as T,
  };
}

export default {
  generateText,
  createRorkTool,
  useRorkAgent,
  generateObject,
};
