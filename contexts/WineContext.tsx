import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { Wine, WineType } from '@/types';
import { mockWines } from '@/mocks/wines';
import { supabase, getDeviceId } from '@/services/supabase';

const WINES_STORAGE_KEY = '@unbottl_wines';

// Convert database row to Wine type
const dbToWine = (row: any): Wine => ({
  id: row.id,
  name: row.name,
  producer: row.producer || '',
  type: row.type || 'red',
  grape: row.grape || '',
  region: row.region || '',
  country: row.country || '',
  vintage: row.vintage,
  price: parseFloat(row.price) || 0,
  description: row.description || '',
  tastingNotes: row.tasting_notes || '',
  pairings: row.pairings || [],
  imageUrl: row.image_url || '',
  inStock: row.in_stock ?? true,
  quantity: row.quantity || 1,
  featured: row.featured ?? false,
  rating: row.rating,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Convert Wine to database row
const wineToDb = (wine: Partial<Wine>, deviceId: string) => ({
  name: wine.name,
  producer: wine.producer,
  type: wine.type,
  grape: wine.grape,
  region: wine.region,
  country: wine.country,
  vintage: wine.vintage,
  price: wine.price,
  description: wine.description,
  tasting_notes: wine.tastingNotes,
  pairings: wine.pairings,
  image_url: wine.imageUrl,
  in_stock: wine.inStock,
  quantity: wine.quantity,
  featured: wine.featured,
  rating: wine.rating,
  device_id: deviceId,
});

export const [WineProvider, useWines] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [wines, setWines] = useState<Wine[]>([]);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  const winesQuery = useQuery({
    queryKey: ['wines'],
    queryFn: async () => {
      try {
        // Try Supabase first
        const deviceId = await getDeviceId();
        const { data, error } = await supabase
          .from('wines')
          .select('*')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('Supabase error, falling back to local storage:', error.message);
          throw error;
        }

        if (data && data.length > 0) {
          console.log('Loaded', data.length, 'wines from Supabase');
          return data.map(dbToWine);
        }

        // If no data in Supabase, check local storage for migration
        const stored = await AsyncStorage.getItem(WINES_STORAGE_KEY);
        if (stored) {
          const localWines = JSON.parse(stored) as Wine[];
          // Migrate local wines to Supabase
          if (localWines.length > 0) {
            console.log('Migrating', localWines.length, 'wines to Supabase');
            for (const wine of localWines) {
              await supabase.from('wines').insert(wineToDb(wine, deviceId));
            }
            // Clear local storage after migration
            await AsyncStorage.removeItem(WINES_STORAGE_KEY);
          }
          return localWines;
        }

        // Return empty array for new users (no mock data)
        return [];
      } catch (error) {
        console.log('Using local storage fallback');
        setUseLocalStorage(true);
        
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem(WINES_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as Wine[];
        }
        return [];
      }
    },
  });

  useEffect(() => {
    if (winesQuery.data) {
      setWines(winesQuery.data);
    }
  }, [winesQuery.data]);

  // Local storage save (fallback)
  const saveWinesLocal = async (updatedWines: Wine[]) => {
    await AsyncStorage.setItem(WINES_STORAGE_KEY, JSON.stringify(updatedWines));
    setWines(updatedWines);
    queryClient.setQueryData(['wines'], updatedWines);
  };

  const addWineMutation = useMutation({
    mutationFn: async (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (useLocalStorage) {
        // Fallback to local storage
        const newWine: Wine = {
          ...wine,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedWines = [...wines, newWine];
        await saveWinesLocal(updatedWines);
        return newWine;
      }

      // Use Supabase
      const deviceId = await getDeviceId();
      const { data, error } = await supabase
        .from('wines')
        .insert(wineToDb(wine, deviceId))
        .select()
        .single();

      if (error) {
        console.error('Error adding wine to Supabase:', error);
        throw error;
      }

      const newWine = dbToWine(data);
      setWines(prev => [newWine, ...prev]);
      queryClient.setQueryData(['wines'], [newWine, ...wines]);
      console.log('Wine added to Supabase:', newWine.name);
      return newWine;
    },
  });

  const updateWineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Wine> }) => {
      if (useLocalStorage) {
        const updatedWines = wines.map(wine =>
          wine.id === id
            ? { ...wine, ...updates, updatedAt: new Date().toISOString() }
            : wine
        );
        await saveWinesLocal(updatedWines);
        return updatedWines.find(w => w.id === id)!;
      }

      // Use Supabase
      const deviceId = await getDeviceId();
      const { data, error } = await supabase
        .from('wines')
        .update({
          ...wineToDb(updates, deviceId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating wine:', error);
        throw error;
      }

      const updatedWine = dbToWine(data);
      const updatedWines = wines.map(w => w.id === id ? updatedWine : w);
      setWines(updatedWines);
      queryClient.setQueryData(['wines'], updatedWines);
      return updatedWine;
    },
  });

  const deleteWineMutation = useMutation({
    mutationFn: async (id: string) => {
      if (useLocalStorage) {
        const updatedWines = wines.filter(wine => wine.id !== id);
        await saveWinesLocal(updatedWines);
        return;
      }

      // Use Supabase
      const { error } = await supabase
        .from('wines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting wine:', error);
        throw error;
      }

      const updatedWines = wines.filter(wine => wine.id !== id);
      setWines(updatedWines);
      queryClient.setQueryData(['wines'], updatedWines);
    },
  });

  const toggleStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const wine = wines.find(w => w.id === id);
      if (!wine) return;

      if (useLocalStorage) {
        const updatedWines = wines.map(w =>
          w.id === id ? { ...w, inStock: !w.inStock, updatedAt: new Date().toISOString() } : w
        );
        await saveWinesLocal(updatedWines);
        return;
      }

      // Use Supabase
      const { error } = await supabase
        .from('wines')
        .update({ 
          in_stock: !wine.inStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error toggling stock:', error);
        throw error;
      }

      const updatedWines = wines.map(w =>
        w.id === id ? { ...w, inStock: !w.inStock, updatedAt: new Date().toISOString() } : w
      );
      setWines(updatedWines);
      queryClient.setQueryData(['wines'], updatedWines);
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
    refetch: winesQuery.refetch,
  };
});
