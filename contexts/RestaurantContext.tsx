import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
  is_founding_member?: boolean;
  founding_member_number?: number;
  founding_member_expires_at?: string;
  // Branding columns as they exist on the table (see db/venue-branding.sql).
  // Writes go through updateRestaurant() and must use these snake_case names.
  logo_url?: string | null;
  cover_image_url?: string | null;
  /** Venue's own accent colour as #RRGGBB; null falls back to Unbottl's. */
  brand_color?: string | null;
  cuisine_type?: string | null;
  menu_slug?: string | null;

  // camelCase aliases added by withDisplayFields() on read, so screens can use
  // the same property names for a context restaurant and a PublicRestaurant.
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  brandColor?: string | null;
  cuisineType?: string;
  menuSlug?: string;
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

const DISPLAY_ALIASES = [
  'logoUrl', 'coverImageUrl', 'brandColor', 'cuisineType', 'menuSlug',
] as const satisfies readonly (keyof Restaurant)[];

/**
 * Add camelCase aliases for the branding columns so a context restaurant and a
 * PublicRestaurant can be read with the same property names. The snake_case
 * originals are kept — updateRestaurant() writes them straight to Postgres.
 */
function withDisplayFields(row: Restaurant): Restaurant {
  return {
    ...row,
    logoUrl: row.logo_url ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    brandColor: row.brand_color ?? null,
    cuisineType: row.cuisine_type ?? undefined,
    menuSlug: row.menu_slug ?? undefined,
  };
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

      setRestaurants(allRestaurants.map(withDisplayFields));

      if (allRestaurants.length > 0) {
        setRestaurant(withDisplayFields(allRestaurants[0]));
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
      setRestaurant(withDisplayFields(found));

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

    // The camelCase aliases are read-side conveniences and aren't real columns;
    // sending them would make Postgres reject the whole update.
    const columns = { ...updates };
    for (const alias of DISPLAY_ALIASES) delete columns[alias];

    const { error } = await supabase
      .from('restaurants')
      .update(columns)
      .eq('id', restaurant.id);

    if (!error) {
      setRestaurant(withDisplayFields({ ...restaurant, ...updates }));
      setRestaurants(prev => prev.map(r => 
        r.id === restaurant.id ? withDisplayFields({ ...r, ...updates }) : r
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
