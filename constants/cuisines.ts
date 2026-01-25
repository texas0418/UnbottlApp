import { Beef, Fish, Drumstick, Salad, Check, Cookie, Utensils, Soup, Wheat, Sandwich } from 'lucide-react-native';
import { ComponentType } from 'react';

export interface CuisineCategory {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  keywords: string[];
  color: string;
}

export const cuisineCategories: CuisineCategory[] = [
  {
    id: 'all',
    label: 'All',
    icon: Utensils,
    keywords: [],
    color: '#6B7280',
  },
  {
    id: 'seafood',
    label: 'Seafood',
    icon: Fish,
    keywords: ['seafood', 'fish', 'salmon', 'tuna', 'lobster', 'crab', 'shrimp', 'oyster', 'scallop', 'mussel', 'clam', 'shellfish', 'sushi', 'sashimi', 'grilled fish', 'raw fish', 'prawn', 'calamari', 'squid', 'octopus'],
    color: '#0EA5E9',
  },
  {
    id: 'steak',
    label: 'Steak & Beef',
    icon: Beef,
    keywords: ['steak', 'beef', 'ribeye', 'tenderloin', 'filet', 'prime rib', 'wagyu', 'burger', 'brisket', 'roast beef', 'veal', 'beef tenderloin', 'sirloin', 'strip', 't-bone', 'porterhouse', 'short rib', 'oxtail'],
    color: '#DC2626',
  },
  {
    id: 'poultry',
    label: 'Poultry',
    icon: Drumstick,
    keywords: ['chicken', 'poultry', 'turkey', 'duck', 'goose', 'quail', 'game bird', 'fowl', 'roast chicken', 'grilled chicken', 'fried chicken', 'rotisserie'],
    color: '#F59E0B',
  },
  {
    id: 'lamb',
    label: 'Lamb & Game',
    icon: Beef,
    keywords: ['lamb', 'lamb rack', 'lamb chop', 'lamb shank', 'game', 'venison', 'boar', 'rabbit', 'bison', 'elk', 'game meat', 'mutton', 'goat'],
    color: '#9333EA',
  },
  {
    id: 'pasta',
    label: 'Pasta & Italian',
    icon: Wheat,
    keywords: ['pasta', 'spaghetti', 'lasagna', 'risotto', 'gnocchi', 'ravioli', 'fettuccine', 'penne', 'linguine', 'carbonara', 'bolognese', 'italian', 'pizza', 'marinara', 'alfredo', 'pesto', 'light pasta'],
    color: '#EA580C',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    icon: Salad,
    keywords: ['vegetarian', 'vegetable', 'salad', 'vegan', 'greens', 'mushroom', 'truffle', 'asparagus', 'artichoke', 'eggplant', 'zucchini', 'summer salad', 'garden', 'plant-based', 'roasted vegetables', 'grilled vegetables'],
    color: '#22C55E',
  },
  {
    id: 'cheese',
    label: 'Cheese',
    icon: Check,
    keywords: ['cheese', 'goat cheese', 'aged cheese', 'blue cheese', 'brie', 'camembert', 'parmesan', 'cheddar', 'gruyere', 'manchego', 'fromage', 'charcuterie', 'cheese board', 'strong cheese'],
    color: '#EAB308',
  },
  {
    id: 'soup',
    label: 'Soups & Stews',
    icon: Soup,
    keywords: ['soup', 'stew', 'broth', 'bisque', 'chowder', 'consomme', 'ramen', 'pho', 'bouillabaisse', 'goulash', 'curry'],
    color: '#14B8A6',
  },
  {
    id: 'appetizer',
    label: 'Appetizers',
    icon: Sandwich,
    keywords: ['appetizer', 'starter', 'tapas', 'bruschetta', 'crostini', 'canapé', 'hors d\'oeuvre', 'small plate', 'caviar', 'pate', 'terrine', 'ceviche'],
    color: '#8B5CF6',
  },
  {
    id: 'dessert',
    label: 'Desserts',
    icon: Cookie,
    keywords: ['dessert', 'chocolate', 'cake', 'pastry', 'fruit', 'tart', 'pie', 'crème brûlée', 'tiramisu', 'mousse', 'ice cream', 'sweet', 'dark chocolate', 'berry', 'celebration'],
    color: '#EC4899',
  },
];

export function matchWineToCuisine(foodPairings: string[], cuisineId: string): boolean {
  if (cuisineId === 'all') return true;
  
  const cuisine = cuisineCategories.find(c => c.id === cuisineId);
  if (!cuisine) return true;
  
  const pairingsLower = foodPairings.map(p => p.toLowerCase()).join(' ');
  
  return cuisine.keywords.some(keyword => 
    pairingsLower.includes(keyword.toLowerCase())
  );
}
