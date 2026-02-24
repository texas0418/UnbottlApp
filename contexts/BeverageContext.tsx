import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wine, WineType, FlavorProfile,
  Beer, Spirit, Cocktail, NonAlcoholicBeverage, BeverageCategory,
  BeerType, SpiritType, CocktailType, NonAlcoholicType
} from '@/types';
import { supabase } from '@/lib/supabase';
import { useRestaurant } from '@/contexts/RestaurantContext';

// ─── Supabase row → App type mappers ──────────────────────────────────

interface SupabaseBeverage {
  id: string;
  restaurant_id: string;
  category: string;
  name: string;
  brand: string | null;
  type: string | null;
  vintage: number | null;
  region: string | null;
  country: string | null;
  description: string | null;
  tasting_notes: string | null;
  price: number;
  glass_price: number | null;
  cost: number | null;
  quantity: number;
  abv: number | null;
  image_url: string | null;
  featured: boolean;
  in_stock: boolean;
  is_active: boolean;
  food_pairings: string[];
  dietary_tags: string[];
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

function toWine(row: SupabaseBeverage): Wine {
  const meta = row.metadata || {};
  return {
    id: row.id,
    name: row.name,
    producer: row.brand || '',
    type: (meta.wineType || row.type || 'red') as WineType,
    vintage: row.vintage || null,
    region: row.region || '',
    country: row.country || '',
    grape: meta.grape || '',
    alcoholContent: row.abv || 0,
    price: Number(row.price) || 0,
    glassPrice: row.glass_price ? Number(row.glass_price) : null,
    tastingNotes: row.tasting_notes || row.description || '',
    foodPairings: row.food_pairings || [],
    inStock: row.in_stock,
    quantity: row.quantity || 0,
    imageUrl: row.image_url,
    featured: row.featured,
    flavorProfile: meta.flavorProfile || { body: 3, sweetness: 2, tannins: 3, acidity: 3 },
    dietaryTags: (row.dietary_tags || []) as any[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBeer(row: SupabaseBeverage): Beer {
  const meta = row.metadata || {};
  return {
    id: row.id,
    name: row.name,
    brewery: row.brand || '',
    type: (meta.beerType || row.type || 'ale') as BeerType,
    style: meta.style || '',
    abv: row.abv || 0,
    ibu: meta.ibu || null,
    origin: row.region || row.country || '',
    price: Number(row.price) || 0,
    servingSize: meta.servingSize || '12oz',
    description: row.description || row.tasting_notes || '',
    foodPairings: row.food_pairings || [],
    inStock: row.in_stock,
    quantity: row.quantity || 0,
    imageUrl: row.image_url,
    featured: row.featured,
    beerProfile: meta.beerProfile || { bitterness: 3, maltiness: 3, hoppy: 3, body: 3 },
    dietaryTags: (row.dietary_tags || []) as any[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSpirit(row: SupabaseBeverage): Spirit {
  const meta = row.metadata || {};
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || '',
    type: (meta.spiritType || row.type || 'whiskey') as SpiritType,
    origin: row.region || row.country || '',
    age: meta.age || null,
    abv: row.abv || 0,
    price: Number(row.price) || 0,
    shotPrice: row.glass_price ? Number(row.glass_price) : null,
    description: row.description || row.tasting_notes || '',
    mixers: meta.mixers || [],
    inStock: row.in_stock,
    quantity: row.quantity || 0,
    imageUrl: row.image_url,
    featured: row.featured,
    spiritProfile: meta.spiritProfile || { smoothness: 3, complexity: 3, sweetness: 3, intensity: 3 },
    dietaryTags: (row.dietary_tags || []) as any[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCocktail(row: SupabaseBeverage): Cocktail {
  const meta = row.metadata || {};
  return {
    id: row.id,
    name: row.name,
    type: (meta.cocktailType || row.type || 'classic') as CocktailType,
    baseSpirit: meta.baseSpirit || '',
    ingredients: meta.ingredients || [],
    garnish: meta.garnish || '',
    glassType: meta.glassType || '',
    price: Number(row.price) || 0,
    description: row.description || row.tasting_notes || '',
    isSignature: meta.isSignature || false,
    isAvailable: row.in_stock,
    imageUrl: row.image_url,
    featured: row.featured,
    dietaryTags: (row.dietary_tags || []) as any[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNonAlcoholic(row: SupabaseBeverage): NonAlcoholicBeverage {
  const meta = row.metadata || {};
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || null,
    type: (meta.naType || row.type || 'other') as NonAlcoholicType,
    description: row.description || row.tasting_notes || '',
    price: Number(row.price) || 0,
    servingSize: meta.servingSize || '',
    calories: meta.calories || null,
    ingredients: meta.ingredients || [],
    inStock: row.in_stock,
    quantity: row.quantity || 0,
    imageUrl: row.image_url,
    featured: row.featured,
    dietaryTags: (row.dietary_tags || []) as any[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── App type → Supabase row mappers ──────────────────────────────────

function wineToRow(wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>, restaurantId: string): Partial<SupabaseBeverage> {
  return {
    restaurant_id: restaurantId,
    category: 'wine',
    name: wine.name,
    brand: wine.producer,
    type: wine.type,
    vintage: wine.vintage,
    region: wine.region,
    country: wine.country,
    tasting_notes: wine.tastingNotes,
    description: wine.tastingNotes,
    price: wine.price,
    glass_price: wine.glassPrice,
    abv: wine.alcoholContent,
    quantity: wine.quantity,
    image_url: wine.imageUrl,
    featured: wine.featured,
    in_stock: wine.inStock,
    food_pairings: wine.foodPairings,
    dietary_tags: wine.dietaryTags as string[],
    metadata: {
      wineType: wine.type,
      grape: wine.grape,
      flavorProfile: wine.flavorProfile,
    },
  };
}

function beerToRow(beer: Omit<Beer, 'id' | 'createdAt' | 'updatedAt'>, restaurantId: string): Partial<SupabaseBeverage> {
  return {
    restaurant_id: restaurantId,
    category: 'beer',
    name: beer.name,
    brand: beer.brewery,
    type: beer.type,
    region: beer.origin,
    description: beer.description,
    price: beer.price,
    abv: beer.abv,
    quantity: beer.quantity,
    image_url: beer.imageUrl,
    featured: beer.featured,
    in_stock: beer.inStock,
    food_pairings: beer.foodPairings,
    dietary_tags: beer.dietaryTags as string[],
    metadata: {
      beerType: beer.type,
      style: beer.style,
      ibu: beer.ibu,
      servingSize: beer.servingSize,
      beerProfile: beer.beerProfile,
    },
  };
}

function spiritToRow(spirit: Omit<Spirit, 'id' | 'createdAt' | 'updatedAt'>, restaurantId: string): Partial<SupabaseBeverage> {
  return {
    restaurant_id: restaurantId,
    category: 'spirit',
    name: spirit.name,
    brand: spirit.brand,
    type: spirit.type,
    region: spirit.origin,
    description: spirit.description,
    price: spirit.price,
    glass_price: spirit.shotPrice,
    abv: spirit.abv,
    quantity: spirit.quantity,
    image_url: spirit.imageUrl,
    featured: spirit.featured,
    in_stock: spirit.inStock,
    dietary_tags: spirit.dietaryTags as string[],
    metadata: {
      spiritType: spirit.type,
      age: spirit.age,
      mixers: spirit.mixers,
      spiritProfile: spirit.spiritProfile,
    },
  };
}

function cocktailToRow(cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>, restaurantId: string): Partial<SupabaseBeverage> {
  return {
    restaurant_id: restaurantId,
    category: 'cocktail',
    name: cocktail.name,
    type: cocktail.type,
    description: cocktail.description,
    price: cocktail.price,
    in_stock: cocktail.isAvailable,
    featured: cocktail.featured,
    image_url: cocktail.imageUrl,
    dietary_tags: cocktail.dietaryTags as string[],
    metadata: {
      cocktailType: cocktail.type,
      baseSpirit: cocktail.baseSpirit,
      ingredients: cocktail.ingredients,
      garnish: cocktail.garnish,
      glassType: cocktail.glassType,
      isSignature: cocktail.isSignature,
    },
  };
}

function nonAlcoholicToRow(na: Omit<NonAlcoholicBeverage, 'id' | 'createdAt' | 'updatedAt'>, restaurantId: string): Partial<SupabaseBeverage> {
  return {
    restaurant_id: restaurantId,
    category: 'non-alcoholic',
    name: na.name,
    brand: na.brand,
    type: na.type,
    description: na.description,
    price: na.price,
    in_stock: na.inStock,
    quantity: na.quantity,
    featured: na.featured,
    image_url: na.imageUrl,
    dietary_tags: na.dietaryTags as string[],
    metadata: {
      naType: na.type,
      servingSize: na.servingSize,
      calories: na.calories,
      ingredients: na.ingredients,
    },
  };
}

// ─── Context ──────────────────────────────────────────────────────────

export const [BeverageProvider, useBeverages] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { restaurant } = useRestaurant();
  const restaurantId = restaurant?.id;

  // Force refetch when restaurant changes
  useEffect(() => {
    if (restaurantId) {
      console.log('[BeverageContext] Restaurant changed to:', restaurantId, '- invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['beverages'] });
    }
  }, [restaurantId, queryClient]);

  // ── Fetch all beverages for current restaurant ──
  const beveragesQuery = useQuery({
    queryKey: ['beverages', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      console.log('[BeverageContext] Fetching beverages for restaurant:', restaurantId);
      const { data, error } = await supabase
        .from('beverages')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching beverages:', error);
        return [];
      }
      console.log('[BeverageContext] Got', data?.length || 0, 'beverages');
      return (data || []) as SupabaseBeverage[];
    },
    enabled: !!restaurantId,
    staleTime: 0, // Always refetch when restaurant changes
  });

  const allRows = beveragesQuery.data || [];

  // ── Split into typed arrays ──
  const wines = useMemo(() => allRows.filter(r => r.category === 'wine').map(toWine), [allRows]);
  const beers = useMemo(() => allRows.filter(r => r.category === 'beer').map(toBeer), [allRows]);
  const spirits = useMemo(() => allRows.filter(r => r.category === 'spirit').map(toSpirit), [allRows]);
  const cocktails = useMemo(() => allRows.filter(r => r.category === 'cocktail').map(toCocktail), [allRows]);
  const nonAlcoholic = useMemo(() => allRows.filter(r => r.category === 'non-alcoholic').map(toNonAlcoholic), [allRows]);

  // ── Featured items ──
  const featuredWines = useMemo(() => wines.filter(w => w.featured && w.inStock), [wines]);
  const featuredBeers = useMemo(() => beers.filter(b => b.featured && b.inStock), [beers]);
  const featuredSpirits = useMemo(() => spirits.filter(s => s.featured && s.inStock), [spirits]);
  const featuredCocktails = useMemo(() => cocktails.filter(c => c.featured && c.isAvailable), [cocktails]);
  const featuredNonAlcoholic = useMemo(() => nonAlcoholic.filter(n => n.featured && n.inStock), [nonAlcoholic]);

  // ── Stats ──
  const stats = useMemo(() => ({
    wines: {
      total: wines.length,
      inStock: wines.filter(w => w.inStock).length,
      featured: featuredWines.length,
    },
    beers: {
      total: beers.length,
      inStock: beers.filter(b => b.inStock).length,
      featured: featuredBeers.length,
    },
    spirits: {
      total: spirits.length,
      inStock: spirits.filter(s => s.inStock).length,
      featured: featuredSpirits.length,
    },
    cocktails: {
      total: cocktails.length,
      available: cocktails.filter(c => c.isAvailable).length,
      featured: featuredCocktails.length,
    },
    nonAlcoholic: {
      total: nonAlcoholic.length,
      inStock: nonAlcoholic.filter(n => n.inStock).length,
      featured: featuredNonAlcoholic.length,
    },
  }), [wines, beers, spirits, cocktails, nonAlcoholic, featuredWines, featuredBeers, featuredSpirits, featuredCocktails, featuredNonAlcoholic]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['beverages', restaurantId] });
  }, [queryClient, restaurantId]);

  // ─── WINE mutations ─────────────────────────────────────────────────

  const addWineMutation = useMutation({
    mutationFn: async (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!restaurantId) throw new Error('No restaurant selected');
      const row = wineToRow(wine, restaurantId);
      const { data, error } = await supabase.from('beverages').insert(row).select().single();
      if (error) throw error;
      return toWine(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const updateWineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Wine> }) => {
      const row: Record<string, any> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.producer !== undefined) row.brand = updates.producer;
      if (updates.price !== undefined) row.price = updates.price;
      if (updates.glassPrice !== undefined) row.glass_price = updates.glassPrice;
      if (updates.alcoholContent !== undefined) row.abv = updates.alcoholContent;
      if (updates.tastingNotes !== undefined) { row.tasting_notes = updates.tastingNotes; row.description = updates.tastingNotes; }
      if (updates.inStock !== undefined) row.in_stock = updates.inStock;
      if (updates.quantity !== undefined) row.quantity = updates.quantity;
      if (updates.featured !== undefined) row.featured = updates.featured;
      if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
      if (updates.foodPairings !== undefined) row.food_pairings = updates.foodPairings;
      if (updates.dietaryTags !== undefined) row.dietary_tags = updates.dietaryTags;
      if (updates.vintage !== undefined) row.vintage = updates.vintage;
      if (updates.region !== undefined) row.region = updates.region;
      if (updates.country !== undefined) row.country = updates.country;
      const existing = allRows.find(r => r.id === id);
      const meta = { ...(existing?.metadata || {}) };
      if (updates.type !== undefined) meta.wineType = updates.type;
      if (updates.grape !== undefined) meta.grape = updates.grape;
      if (updates.flavorProfile !== undefined) meta.flavorProfile = updates.flavorProfile;
      row.metadata = meta;

      const { data, error } = await supabase.from('beverages').update(row).eq('id', id).select().single();
      if (error) throw error;
      return toWine(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const deleteWineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beverages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ─── BEER mutations ────────────────────────────────────────────────

  const addBeerMutation = useMutation({
    mutationFn: async (beer: Omit<Beer, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!restaurantId) throw new Error('No restaurant selected');
      const row = beerToRow(beer, restaurantId);
      const { data, error } = await supabase.from('beverages').insert(row).select().single();
      if (error) throw error;
      return toBeer(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const updateBeerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Beer> }) => {
      const row: Record<string, any> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.brewery !== undefined) row.brand = updates.brewery;
      if (updates.price !== undefined) row.price = updates.price;
      if (updates.abv !== undefined) row.abv = updates.abv;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.inStock !== undefined) row.in_stock = updates.inStock;
      if (updates.quantity !== undefined) row.quantity = updates.quantity;
      if (updates.featured !== undefined) row.featured = updates.featured;
      if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
      if (updates.foodPairings !== undefined) row.food_pairings = updates.foodPairings;
      if (updates.dietaryTags !== undefined) row.dietary_tags = updates.dietaryTags;
      // Store type-specific fields in metadata
      const existing = allRows.find(r => r.id === id);
      const meta = { ...(existing?.metadata || {}) };
      if (updates.type !== undefined) meta.beerType = updates.type;
      if (updates.style !== undefined) meta.style = updates.style;
      if (updates.ibu !== undefined) meta.ibu = updates.ibu;
      if (updates.beerProfile !== undefined) meta.beerProfile = updates.beerProfile;
      row.metadata = meta;

      const { data, error } = await supabase.from('beverages').update(row).eq('id', id).select().single();
      if (error) throw error;
      return toBeer(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const deleteBeerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beverages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ─── SPIRIT mutations ──────────────────────────────────────────────

  const addSpiritMutation = useMutation({
    mutationFn: async (spirit: Omit<Spirit, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!restaurantId) throw new Error('No restaurant selected');
      const row = spiritToRow(spirit, restaurantId);
      const { data, error } = await supabase.from('beverages').insert(row).select().single();
      if (error) throw error;
      return toSpirit(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const updateSpiritMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Spirit> }) => {
      const row: Record<string, any> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.brand !== undefined) row.brand = updates.brand;
      if (updates.price !== undefined) row.price = updates.price;
      if (updates.shotPrice !== undefined) row.glass_price = updates.shotPrice;
      if (updates.abv !== undefined) row.abv = updates.abv;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.inStock !== undefined) row.in_stock = updates.inStock;
      if (updates.quantity !== undefined) row.quantity = updates.quantity;
      if (updates.featured !== undefined) row.featured = updates.featured;
      if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
      if (updates.dietaryTags !== undefined) row.dietary_tags = updates.dietaryTags;
      const existing = allRows.find(r => r.id === id);
      const meta = { ...(existing?.metadata || {}) };
      if (updates.type !== undefined) meta.spiritType = updates.type;
      if (updates.age !== undefined) meta.age = updates.age;
      if (updates.mixers !== undefined) meta.mixers = updates.mixers;
      if (updates.spiritProfile !== undefined) meta.spiritProfile = updates.spiritProfile;
      row.metadata = meta;

      const { data, error } = await supabase.from('beverages').update(row).eq('id', id).select().single();
      if (error) throw error;
      return toSpirit(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const deleteSpiritMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beverages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ─── COCKTAIL mutations ────────────────────────────────────────────

  const addCocktailMutation = useMutation({
    mutationFn: async (cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!restaurantId) throw new Error('No restaurant selected');
      const row = cocktailToRow(cocktail, restaurantId);
      const { data, error } = await supabase.from('beverages').insert(row).select().single();
      if (error) throw error;
      return toCocktail(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const updateCocktailMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cocktail> }) => {
      const row: Record<string, any> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.price !== undefined) row.price = updates.price;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.isAvailable !== undefined) row.in_stock = updates.isAvailable;
      if (updates.featured !== undefined) row.featured = updates.featured;
      if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
      if (updates.dietaryTags !== undefined) row.dietary_tags = updates.dietaryTags;
      const existing = allRows.find(r => r.id === id);
      const meta = { ...(existing?.metadata || {}) };
      if (updates.type !== undefined) meta.cocktailType = updates.type;
      if (updates.baseSpirit !== undefined) meta.baseSpirit = updates.baseSpirit;
      if (updates.ingredients !== undefined) meta.ingredients = updates.ingredients;
      if (updates.garnish !== undefined) meta.garnish = updates.garnish;
      if (updates.glassType !== undefined) meta.glassType = updates.glassType;
      if (updates.isSignature !== undefined) meta.isSignature = updates.isSignature;
      row.metadata = meta;

      const { data, error } = await supabase.from('beverages').update(row).eq('id', id).select().single();
      if (error) throw error;
      return toCocktail(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const deleteCocktailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beverages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ─── NON-ALCOHOLIC mutations ───────────────────────────────────────

  const addNonAlcoholicMutation = useMutation({
    mutationFn: async (beverage: Omit<NonAlcoholicBeverage, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!restaurantId) throw new Error('No restaurant selected');
      const row = nonAlcoholicToRow(beverage, restaurantId);
      const { data, error } = await supabase.from('beverages').insert(row).select().single();
      if (error) throw error;
      return toNonAlcoholic(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const updateNonAlcoholicMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NonAlcoholicBeverage> }) => {
      const row: Record<string, any> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.brand !== undefined) row.brand = updates.brand;
      if (updates.price !== undefined) row.price = updates.price;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.inStock !== undefined) row.in_stock = updates.inStock;
      if (updates.quantity !== undefined) row.quantity = updates.quantity;
      if (updates.featured !== undefined) row.featured = updates.featured;
      if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
      if (updates.dietaryTags !== undefined) row.dietary_tags = updates.dietaryTags;
      const existing = allRows.find(r => r.id === id);
      const meta = { ...(existing?.metadata || {}) };
      if (updates.type !== undefined) meta.naType = updates.type;
      if (updates.servingSize !== undefined) meta.servingSize = updates.servingSize;
      if (updates.calories !== undefined) meta.calories = updates.calories;
      if (updates.ingredients !== undefined) meta.ingredients = updates.ingredients;
      row.metadata = meta;

      const { data, error } = await supabase.from('beverages').update(row).eq('id', id).select().single();
      if (error) throw error;
      return toNonAlcoholic(data as SupabaseBeverage);
    },
    onSuccess: invalidate,
  });

  const deleteNonAlcoholicMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beverages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ─── Return same interface as before ───────────────────────────────

  const isLoading = beveragesQuery.isLoading;

  return {
    wines,
    beers,
    spirits,
    cocktails,
    nonAlcoholic,
    featuredWines,
    featuredBeers,
    featuredSpirits,
    featuredCocktails,
    featuredNonAlcoholic,
    stats,
    isLoading,
    
    addWine: addWineMutation.mutateAsync,
    updateWine: updateWineMutation.mutateAsync,
    deleteWine: deleteWineMutation.mutateAsync,
    isAddingWine: addWineMutation.isPending,
    
    addBeer: addBeerMutation.mutateAsync,
    updateBeer: updateBeerMutation.mutateAsync,
    deleteBeer: deleteBeerMutation.mutateAsync,
    isAddingBeer: addBeerMutation.isPending,
    
    addSpirit: addSpiritMutation.mutateAsync,
    updateSpirit: updateSpiritMutation.mutateAsync,
    deleteSpirit: deleteSpiritMutation.mutateAsync,
    isAddingSpirit: addSpiritMutation.isPending,
    
    addCocktail: addCocktailMutation.mutateAsync,
    updateCocktail: updateCocktailMutation.mutateAsync,
    deleteCocktail: deleteCocktailMutation.mutateAsync,
    isAddingCocktail: addCocktailMutation.isPending,
    
    addNonAlcoholic: addNonAlcoholicMutation.mutateAsync,
    updateNonAlcoholic: updateNonAlcoholicMutation.mutateAsync,
    deleteNonAlcoholic: deleteNonAlcoholicMutation.mutateAsync,
    isAddingNonAlcoholic: addNonAlcoholicMutation.isPending,
    
    getWineById: (id: string) => wines.find(w => w.id === id),
    getBeerById: (id: string) => beers.find(b => b.id === id),
    getSpiritById: (id: string) => spirits.find(s => s.id === id),
    getCocktailById: (id: string) => cocktails.find(c => c.id === id),
    getNonAlcoholicById: (id: string) => nonAlcoholic.find(n => n.id === id),
    
    getWinesByType: (type: WineType) => wines.filter(w => w.type === type),
    getBeersByType: (type: BeerType) => beers.filter(b => b.type === type),
    getSpiritsByType: (type: SpiritType) => spirits.filter(s => s.type === type),
    getCocktailsByType: (type: CocktailType) => cocktails.filter(c => c.type === type),
    getNonAlcoholicByType: (type: NonAlcoholicType) => nonAlcoholic.filter(n => n.type === type),
  };
});
