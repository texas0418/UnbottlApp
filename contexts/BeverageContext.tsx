import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { 
  Beer, Spirit, Cocktail, NonAlcoholicBeverage, BeverageCategory,
  BeerType, SpiritType, CocktailType, NonAlcoholicType
} from '@/types';
import { mockBeers, mockSpirits, mockCocktails, mockNonAlcoholic } from '@/mocks/beverages';

const BEERS_STORAGE_KEY = '@unbottl_beers';
const SPIRITS_STORAGE_KEY = '@unbottl_spirits';
const COCKTAILS_STORAGE_KEY = '@unbottl_cocktails';
const NON_ALCOHOLIC_STORAGE_KEY = '@unbottl_non_alcoholic';

export const [BeverageProvider, useBeverages] = createContextHook(() => {
  const queryClient = useQueryClient();
  
  const [beers, setBeers] = useState<Beer[]>([]);
  const [spirits, setSpirits] = useState<Spirit[]>([]);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [nonAlcoholic, setNonAlcoholic] = useState<NonAlcoholicBeverage[]>([]);

  const beersQuery = useQuery({
    queryKey: ['beers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BEERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Beer[];
      }
      await AsyncStorage.setItem(BEERS_STORAGE_KEY, JSON.stringify(mockBeers));
      return mockBeers;
    },
  });

  const spiritsQuery = useQuery({
    queryKey: ['spirits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SPIRITS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Spirit[];
      }
      await AsyncStorage.setItem(SPIRITS_STORAGE_KEY, JSON.stringify(mockSpirits));
      return mockSpirits;
    },
  });

  const cocktailsQuery = useQuery({
    queryKey: ['cocktails'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(COCKTAILS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Cocktail[];
      }
      await AsyncStorage.setItem(COCKTAILS_STORAGE_KEY, JSON.stringify(mockCocktails));
      return mockCocktails;
    },
  });

  const nonAlcoholicQuery = useQuery({
    queryKey: ['nonAlcoholic'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(NON_ALCOHOLIC_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as NonAlcoholicBeverage[];
      }
      await AsyncStorage.setItem(NON_ALCOHOLIC_STORAGE_KEY, JSON.stringify(mockNonAlcoholic));
      return mockNonAlcoholic;
    },
  });

  useEffect(() => {
    if (beersQuery.data) setBeers(beersQuery.data);
  }, [beersQuery.data]);

  useEffect(() => {
    if (spiritsQuery.data) setSpirits(spiritsQuery.data);
  }, [spiritsQuery.data]);

  useEffect(() => {
    if (cocktailsQuery.data) setCocktails(cocktailsQuery.data);
  }, [cocktailsQuery.data]);

  useEffect(() => {
    if (nonAlcoholicQuery.data) setNonAlcoholic(nonAlcoholicQuery.data);
  }, [nonAlcoholicQuery.data]);

  const saveBeers = async (updated: Beer[]) => {
    await AsyncStorage.setItem(BEERS_STORAGE_KEY, JSON.stringify(updated));
    setBeers(updated);
    queryClient.setQueryData(['beers'], updated);
  };

  const saveSpirits = async (updated: Spirit[]) => {
    await AsyncStorage.setItem(SPIRITS_STORAGE_KEY, JSON.stringify(updated));
    setSpirits(updated);
    queryClient.setQueryData(['spirits'], updated);
  };

  const saveCocktails = async (updated: Cocktail[]) => {
    await AsyncStorage.setItem(COCKTAILS_STORAGE_KEY, JSON.stringify(updated));
    setCocktails(updated);
    queryClient.setQueryData(['cocktails'], updated);
  };

  const saveNonAlcoholic = async (updated: NonAlcoholicBeverage[]) => {
    await AsyncStorage.setItem(NON_ALCOHOLIC_STORAGE_KEY, JSON.stringify(updated));
    setNonAlcoholic(updated);
    queryClient.setQueryData(['nonAlcoholic'], updated);
  };

  const addBeerMutation = useMutation({
    mutationFn: async (beer: Omit<Beer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newBeer: Beer = {
        ...beer,
        id: `beer-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...beers, newBeer];
      await saveBeers(updated);
      return newBeer;
    },
  });

  const updateBeerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Beer> }) => {
      const updated = beers.map(b =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      );
      await saveBeers(updated);
      return updated.find(b => b.id === id)!;
    },
  });

  const deleteBeerMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = beers.filter(b => b.id !== id);
      await saveBeers(updated);
    },
  });

  const addSpiritMutation = useMutation({
    mutationFn: async (spirit: Omit<Spirit, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newSpirit: Spirit = {
        ...spirit,
        id: `spirit-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...spirits, newSpirit];
      await saveSpirits(updated);
      return newSpirit;
    },
  });

  const updateSpiritMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Spirit> }) => {
      const updated = spirits.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
      await saveSpirits(updated);
      return updated.find(s => s.id === id)!;
    },
  });

  const deleteSpiritMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = spirits.filter(s => s.id !== id);
      await saveSpirits(updated);
    },
  });

  const addCocktailMutation = useMutation({
    mutationFn: async (cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newCocktail: Cocktail = {
        ...cocktail,
        id: `cocktail-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...cocktails, newCocktail];
      await saveCocktails(updated);
      return newCocktail;
    },
  });

  const updateCocktailMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cocktail> }) => {
      const updated = cocktails.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      await saveCocktails(updated);
      return updated.find(c => c.id === id)!;
    },
  });

  const deleteCocktailMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = cocktails.filter(c => c.id !== id);
      await saveCocktails(updated);
    },
  });

  const addNonAlcoholicMutation = useMutation({
    mutationFn: async (beverage: Omit<NonAlcoholicBeverage, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newBeverage: NonAlcoholicBeverage = {
        ...beverage,
        id: `na-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...nonAlcoholic, newBeverage];
      await saveNonAlcoholic(updated);
      return newBeverage;
    },
  });

  const updateNonAlcoholicMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NonAlcoholicBeverage> }) => {
      const updated = nonAlcoholic.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      );
      await saveNonAlcoholic(updated);
      return updated.find(n => n.id === id)!;
    },
  });

  const deleteNonAlcoholicMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = nonAlcoholic.filter(n => n.id !== id);
      await saveNonAlcoholic(updated);
    },
  });

  const featuredBeers = useMemo(() => beers.filter(b => b.featured && b.inStock), [beers]);
  const featuredSpirits = useMemo(() => spirits.filter(s => s.featured && s.inStock), [spirits]);
  const featuredCocktails = useMemo(() => cocktails.filter(c => c.featured && c.isAvailable), [cocktails]);
  const featuredNonAlcoholic = useMemo(() => nonAlcoholic.filter(n => n.featured && n.inStock), [nonAlcoholic]);

  const stats = useMemo(() => ({
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
  }), [beers, spirits, cocktails, nonAlcoholic, featuredBeers, featuredSpirits, featuredCocktails, featuredNonAlcoholic]);

  const isLoading = beersQuery.isLoading || spiritsQuery.isLoading || cocktailsQuery.isLoading || nonAlcoholicQuery.isLoading;

  return {
    beers,
    spirits,
    cocktails,
    nonAlcoholic,
    featuredBeers,
    featuredSpirits,
    featuredCocktails,
    featuredNonAlcoholic,
    stats,
    isLoading,
    
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
    
    getBeerById: (id: string) => beers.find(b => b.id === id),
    getSpiritById: (id: string) => spirits.find(s => s.id === id),
    getCocktailById: (id: string) => cocktails.find(c => c.id === id),
    getNonAlcoholicById: (id: string) => nonAlcoholic.find(n => n.id === id),
    
    getBeersByType: (type: BeerType) => beers.filter(b => b.type === type),
    getSpiritsByType: (type: SpiritType) => spirits.filter(s => s.type === type),
    getCocktailsByType: (type: CocktailType) => cocktails.filter(c => c.type === type),
    getNonAlcoholicByType: (type: NonAlcoholicType) => nonAlcoholic.filter(n => n.type === type),
  };
});
