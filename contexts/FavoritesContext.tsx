import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const FAVORITES_STORAGE_KEY = '@unbottl_favorites';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) as string[] : [];
    },
  });

  useEffect(() => {
    if (favoritesQuery.data) {
      setFavoriteIds(favoritesQuery.data);
    }
  }, [favoritesQuery.data]);

  const saveFavorites = async (updatedFavorites: string[]) => {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    setFavoriteIds(updatedFavorites);
    queryClient.setQueryData(['favorites'], updatedFavorites);
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (wineId: string) => {
      const isFavorite = favoriteIds.includes(wineId);
      const updatedFavorites = isFavorite
        ? favoriteIds.filter(id => id !== wineId)
        : [...favoriteIds, wineId];
      
      await saveFavorites(updatedFavorites);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(
          isFavorite 
            ? Haptics.ImpactFeedbackStyle.Light 
            : Haptics.ImpactFeedbackStyle.Medium
        );
      }
      
      return { wineId, isFavorite: !isFavorite };
    },
  });

  const clearAllFavoritesMutation = useMutation({
    mutationFn: async () => {
      await saveFavorites([]);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const isFavorite = useCallback((wineId: string) => {
    return favoriteIds.includes(wineId);
  }, [favoriteIds]);

  const favoritesCount = useMemo(() => favoriteIds.length, [favoriteIds]);

  return {
    favoriteIds,
    isLoading: favoritesQuery.isLoading,
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
    clearAllFavorites: clearAllFavoritesMutation.mutateAsync,
    isFavorite,
    favoritesCount,
    isToggling: toggleFavoriteMutation.isPending,
  };
});
