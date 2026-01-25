import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { Wine, WineType } from '@/types';
import { mockWines } from '@/mocks/wines';

const WINES_STORAGE_KEY = '@unbottl_wines';

export const [WineProvider, useWines] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [wines, setWines] = useState<Wine[]>([]);

  const winesQuery = useQuery({
    queryKey: ['wines'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(WINES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Wine[];
      }
      await AsyncStorage.setItem(WINES_STORAGE_KEY, JSON.stringify(mockWines));
      return mockWines;
    },
  });

  useEffect(() => {
    if (winesQuery.data) {
      setWines(winesQuery.data);
    }
  }, [winesQuery.data]);

  const saveWines = async (updatedWines: Wine[]) => {
    await AsyncStorage.setItem(WINES_STORAGE_KEY, JSON.stringify(updatedWines));
    setWines(updatedWines);
    queryClient.setQueryData(['wines'], updatedWines);
  };

  const addWineMutation = useMutation({
    mutationFn: async (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newWine: Wine = {
        ...wine,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedWines = [...wines, newWine];
      await saveWines(updatedWines);
      return newWine;
    },
  });

  const updateWineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Wine> }) => {
      const updatedWines = wines.map(wine =>
        wine.id === id
          ? { ...wine, ...updates, updatedAt: new Date().toISOString() }
          : wine
      );
      await saveWines(updatedWines);
      return updatedWines.find(w => w.id === id)!;
    },
  });

  const deleteWineMutation = useMutation({
    mutationFn: async (id: string) => {
      const updatedWines = wines.filter(wine => wine.id !== id);
      await saveWines(updatedWines);
    },
  });

  const toggleStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const wine = wines.find(w => w.id === id);
      if (wine) {
        const updatedWines = wines.map(w =>
          w.id === id ? { ...w, inStock: !w.inStock, updatedAt: new Date().toISOString() } : w
        );
        await saveWines(updatedWines);
      }
    },
  });

  const featuredWines = useMemo(() => wines.filter(w => w.featured && w.inStock), [wines]);
  const inStockWines = useMemo(() => wines.filter(w => w.inStock), [wines]);
  const outOfStockWines = useMemo(() => wines.filter(w => !w.inStock), [wines]);

  const getWinesByType = (type: WineType) => wines.filter(w => w.type === type);

  const stats = useMemo(() => ({
    total: wines.length,
    inStock: inStockWines.length,
    outOfStock: outOfStockWines.length,
    featured: featuredWines.length,
    totalValue: wines.reduce((sum, w) => sum + (w.price * w.quantity), 0),
  }), [wines, inStockWines, outOfStockWines, featuredWines]);

  return {
    wines,
    featuredWines,
    inStockWines,
    outOfStockWines,
    stats,
    isLoading: winesQuery.isLoading,
    addWine: addWineMutation.mutateAsync,
    updateWine: updateWineMutation.mutateAsync,
    deleteWine: deleteWineMutation.mutateAsync,
    toggleStock: toggleStockMutation.mutateAsync,
    getWinesByType,
    getWineById: (id: string) => wines.find(w => w.id === id),
    isAddingWine: addWineMutation.isPending,
    isUpdatingWine: updateWineMutation.isPending,
  };
});
