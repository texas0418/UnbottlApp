/**
 * Mock AI Toolkit Service
 * Provides mock implementations for AI features
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

const SOMMELIER_RESPONSES = [
  "Based on your preferences, I'd recommend trying our Pinot Noir Reserve. It's an elegant medium-bodied red that pairs wonderfully with grilled salmon or roasted chicken.",
  "For what you're looking for, our Sauvignon Blanc would be perfect. It offers crisp citrus notes with hints of green apple. It's particularly delightful when paired with seafood.",
  "I think you'll love our Cabernet Sauvignon! It's bold and full-bodied with a beautiful lingering finish. This one is a staff favorite and goes excellently with steak.",
];

const WINE_SCANNER_RESPONSES = [
  { name: "Château Margaux 2015", producer: "Château Margaux", type: "red", region: "Margaux, Bordeaux", country: "France", vintage: 2015, grape: "Cabernet Sauvignon blend" },
  { name: "Opus One 2018", producer: "Opus One Winery", type: "red", region: "Napa Valley", country: "USA", vintage: 2018, grape: "Cabernet Sauvignon blend" },
  { name: "Cloudy Bay Sauvignon Blanc 2022", producer: "Cloudy Bay", type: "white", region: "Marlborough", country: "New Zealand", vintage: 2022, grape: "Sauvignon Blanc" },
];

export function createRorkTool<T>(config: ToolConfig<T>): ToolConfig<T> {
  return config;
}

export function useRorkAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [error, setError] = useState<Error | undefined>();

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
    
    return "I'd be happy to help you find the perfect beverage! Could you tell me more about what you're in the mood for?";
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setStatus('submitted');

    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
      setStatus('streaming');
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: generateMockResponse(content),
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setStatus('error');
    }
  }, [generateMockResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus('idle');
    setError(undefined);
  }, []);

  return { messages, sendMessage, status, error, clearMessages };
}

export interface GenerateObjectOptions<T = any> {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: any }>;
  schema?: z.ZodType<T>;
}

export async function generateObject<T = any>(options: GenerateObjectOptions<T>): Promise<{ object: T }> {
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
  createRorkTool,
  useRorkAgent,
  generateObject,
};
