// hooks/useFavorites.ts
// Manage user's favorite beverages and restaurants

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface FavoriteBeverage {
  id: string;
  beverage_id: string;
  notes: string | null;
  rating: number | null;
  created_at: string;
  beverage?: {
    id: string;
    name: string;
    type: string;
    brand: string | null;
    image_url: string | null;
    restaurant?: {
      id: string;
      name: string;
    };
  };
}

export interface FavoriteRestaurant {
  id: string;
  restaurant_id: string;
  notes: string | null;
  created_at: string;
  restaurant?: {
    id: string;
    name: string;
    email: string | null;
    locations?: {
      id: string;
      name: string;
      city: string | null;
      state: string | null;
    }[];
  };
}

export interface BeverageLogEntry {
  id: string;
  beverage_id: string | null;
  beverage_name: string;
  beverage_type: string | null;
  beverage_brand: string | null;
  rating: number | null;
  notes: string | null;
  tasting_notes: string | null;
  price_paid: number | null;
  consumed_at: string;
  restaurant?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
}

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteBeverages, setFavoriteBeverages] = useState<FavoriteBeverage[]>([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [beverageLog, setBeverageLog] = useState<BeverageLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteBeverages([]);
      setFavoriteRestaurants([]);
      setBeverageLog([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch favorite beverages with details
      const { data: beverages, error: bevError } = await supabase
        .from('favorite_beverages')
        .select(`
          *,
          beverage:beverages(
            id, name, type, brand, image_url,
            restaurant:restaurants(id, name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bevError) throw bevError;

      // Fetch favorite restaurants with locations
      const { data: restaurants, error: restError } = await supabase
        .from('favorite_restaurants')
        .select(`
          *,
          restaurant:restaurants(
            id, name, email,
            locations(id, name, city, state)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (restError) throw restError;

      // Fetch beverage log
      const { data: log, error: logError } = await supabase
        .from('user_beverage_log')
        .select(`
          *,
          restaurant:restaurants(id, name),
          location:locations(id, name)
        `)
        .eq('user_id', user.id)
        .order('consumed_at', { ascending: false })
        .limit(50);

      if (logError) throw logError;

      setFavoriteBeverages(beverages || []);
      setFavoriteRestaurants(restaurants || []);
      setBeverageLog(log || []);

    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if beverage is favorited
  const isBeverageFavorited = useCallback((beverageId: string) => {
    return favoriteBeverages.some(f => f.beverage_id === beverageId);
  }, [favoriteBeverages]);

  // Check if restaurant is favorited
  const isRestaurantFavorited = useCallback((restaurantId: string) => {
    return favoriteRestaurants.some(f => f.restaurant_id === restaurantId);
  }, [favoriteRestaurants]);

  // Toggle favorite beverage
  const toggleFavoriteBeverage = async (beverageId: string, notes?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const existing = favoriteBeverages.find(f => f.beverage_id === beverageId);

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorite_beverages')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        setFavoriteBeverages(prev => prev.filter(f => f.id !== existing.id));
      } else {
        // Add favorite
        const { data, error } = await supabase
          .from('favorite_beverages')
          .insert({
            user_id: user.id,
            beverage_id: beverageId,
            notes,
          })
          .select(`
            *,
            beverage:beverages(
              id, name, type, brand, image_url,
              restaurant:restaurants(id, name)
            )
          `)
          .single();

        if (error) throw error;

        setFavoriteBeverages(prev => [data, ...prev]);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
      return { error: err };
    }
  };

  // Toggle favorite restaurant
  const toggleFavoriteRestaurant = async (restaurantId: string, notes?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const existing = favoriteRestaurants.find(f => f.restaurant_id === restaurantId);

      if (existing) {
        const { error } = await supabase
          .from('favorite_restaurants')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        setFavoriteRestaurants(prev => prev.filter(f => f.id !== existing.id));
      } else {
        const { data, error } = await supabase
          .from('favorite_restaurants')
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId,
            notes,
          })
          .select(`
            *,
            restaurant:restaurants(
              id, name, email,
              locations(id, name, city, state)
            )
          `)
          .single();

        if (error) throw error;

        setFavoriteRestaurants(prev => [data, ...prev]);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Toggle favorite restaurant error:', err);
      return { error: err };
    }
  };

  // Rate a favorite beverage
  const rateBeverage = async (beverageId: string, rating: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const existing = favoriteBeverages.find(f => f.beverage_id === beverageId);

      if (existing) {
        const { error } = await supabase
          .from('favorite_beverages')
          .update({ rating })
          .eq('id', existing.id);

        if (error) throw error;

        setFavoriteBeverages(prev =>
          prev.map(f => f.id === existing.id ? { ...f, rating } : f)
        );
      } else {
        // Add as favorite with rating
        await toggleFavoriteBeverage(beverageId);
        // Then update rating
        const { error } = await supabase
          .from('favorite_beverages')
          .update({ rating })
          .eq('user_id', user.id)
          .eq('beverage_id', beverageId);

        if (error) throw error;
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Log a beverage (track what user has tried)
  const logBeverage = async (entry: {
    beverage_id?: string;
    beverage_name: string;
    beverage_type?: string;
    beverage_brand?: string;
    restaurant_id?: string;
    location_id?: string;
    rating?: number;
    notes?: string;
    tasting_notes?: string;
    price_paid?: number;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('user_beverage_log')
        .insert({
          user_id: user.id,
          ...entry,
          consumed_at: new Date().toISOString(),
        })
        .select(`
          *,
          restaurant:restaurants(id, name),
          location:locations(id, name)
        `)
        .single();

      if (error) throw error;

      setBeverageLog(prev => [data, ...prev]);

      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  return {
    favoriteBeverages,
    favoriteRestaurants,
    beverageLog,
    loading,
    isBeverageFavorited,
    isRestaurantFavorited,
    toggleFavoriteBeverage,
    toggleFavoriteRestaurant,
    rateBeverage,
    logBeverage,
    refetch: fetchFavorites,
  };
}
