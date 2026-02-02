import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_founding_member?: boolean;
  founding_member_number?: number;
  founding_member_expires_at?: string;
}

export interface Location {
  id: string;
  restaurant_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_active: boolean;
}

export const [RestaurantProvider, useRestaurant] = createContextHook(() => {
  const { user, userType } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    if (!user || userType !== 'restaurant_owner') {
      setLoading(false);
      setRestaurant(null);
      setRestaurants([]);
      return;
    }

    try {
      setLoading(true);

      // First check if user owns any restaurants directly
      const { data: ownedRestaurants, error: ownedError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Also check if user is staff at any restaurants
      const { data: staffRecords, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (staffError) throw staffError;

      let allRestaurants = ownedRestaurants || [];

      // Fetch restaurants where user is staff
      if (staffRecords && staffRecords.length > 0) {
        const staffRestaurantIds = staffRecords.map(s => s.restaurant_id);
        const { data: staffRestaurants } = await supabase
          .from('restaurants')
          .select('*')
          .in('id', staffRestaurantIds);

        if (staffRestaurants) {
          // Merge and dedupe
          const existingIds = new Set(allRestaurants.map(r => r.id));
          for (const r of staffRestaurants) {
            if (!existingIds.has(r.id)) {
              allRestaurants.push(r);
            }
          }
        }
      }

      setRestaurants(allRestaurants);

      if (allRestaurants.length > 0) {
        setRestaurant(allRestaurants[0]);
        setNeedsSetup(false);

        // Fetch locations for the restaurant
        const { data: locationData } = await supabase
          .from('locations')
          .select('*')
          .eq('restaurant_id', allRestaurants[0].id)
          .eq('is_active', true);

        setLocations(locationData || []);
      } else {
        setRestaurant(null);
        setNeedsSetup(true);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const switchRestaurant = useCallback(async (restaurantId: string) => {
    const found = restaurants.find(r => r.id === restaurantId);
    if (found) {
      setRestaurant(found);

      // Fetch locations for this restaurant
      const { data: locationData } = await supabase
        .from('locations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      setLocations(locationData || []);
    }
  }, [restaurants]);

  const updateRestaurant = useCallback(async (updates: Partial<Restaurant>) => {
    if (!restaurant) return { error: new Error('No restaurant selected') };

    const { error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurant.id);

    if (!error) {
      setRestaurant({ ...restaurant, ...updates });
      setRestaurants(prev => prev.map(r => 
        r.id === restaurant.id ? { ...r, ...updates } : r
      ));
    }

    return { error };
  }, [restaurant]);

  const refetch = useCallback(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurant,
    restaurants,
    locations,
    loading,
    needsSetup,
    switchRestaurant,
    updateRestaurant,
    refetch,
  };
});
