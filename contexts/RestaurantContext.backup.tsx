import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';
import { mockRestaurant } from '@/mocks/restaurants';

const RESTAURANT_STORAGE_KEY = '@unbottl_restaurant';
const RESTAURANTS_LIST_KEY = '@unbottl_restaurants_list';

export const [RestaurantProvider, useRestaurant] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const restaurantsQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(RESTAURANTS_LIST_KEY);
      if (stored) {
        return JSON.parse(stored) as Restaurant[];
      }
      const initial = [mockRestaurant];
      await AsyncStorage.setItem(RESTAURANTS_LIST_KEY, JSON.stringify(initial));
      return initial;
    },
  });

  const currentRestaurantQuery = useQuery({
    queryKey: ['currentRestaurant'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(RESTAURANT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Restaurant;
      }
      await AsyncStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(mockRestaurant));
      return mockRestaurant;
    },
  });

  useEffect(() => {
    if (restaurantsQuery.data) {
      setRestaurants(restaurantsQuery.data);
    }
  }, [restaurantsQuery.data]);

  useEffect(() => {
    if (currentRestaurantQuery.data) {
      setCurrentRestaurant(currentRestaurantQuery.data);
    }
  }, [currentRestaurantQuery.data]);

  const updateRestaurantMutation = useMutation({
    mutationFn: async (updates: Partial<Restaurant>) => {
      if (!currentRestaurant) throw new Error('No restaurant selected');
      
      const updated: Restaurant = {
        ...currentRestaurant,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(updated));
      
      const updatedList = restaurants.map(r => r.id === updated.id ? updated : r);
      await AsyncStorage.setItem(RESTAURANTS_LIST_KEY, JSON.stringify(updatedList));
      
      setCurrentRestaurant(updated);
      setRestaurants(updatedList);
      queryClient.setQueryData(['currentRestaurant'], updated);
      queryClient.setQueryData(['restaurants'], updatedList);
      
      return updated;
    },
  });

  const addRestaurantMutation = useMutation({
    mutationFn: async (restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newRestaurant: Restaurant = {
        ...restaurant,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedList = [...restaurants, newRestaurant];
      await AsyncStorage.setItem(RESTAURANTS_LIST_KEY, JSON.stringify(updatedList));
      setRestaurants(updatedList);
      queryClient.setQueryData(['restaurants'], updatedList);
      
      return newRestaurant;
    },
  });

  const switchRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if (!restaurant) throw new Error('Restaurant not found');
      
      await AsyncStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(restaurant));
      setCurrentRestaurant(restaurant);
      queryClient.setQueryData(['currentRestaurant'], restaurant);
      
      return restaurant;
    },
  });

  return {
    restaurant: currentRestaurant,
    restaurants,
    isLoading: currentRestaurantQuery.isLoading || restaurantsQuery.isLoading,
    updateRestaurant: updateRestaurantMutation.mutateAsync,
    addRestaurant: addRestaurantMutation.mutateAsync,
    switchRestaurant: switchRestaurantMutation.mutateAsync,
    isUpdating: updateRestaurantMutation.isPending,
  };
});
