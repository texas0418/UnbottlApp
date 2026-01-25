import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BeverageCategory } from '@/types';

const WISHLIST_STORAGE_KEY = '@unbottl_wishlist';

export interface WishlistItem {
  id: string;
  beverageId: string;
  beverageName: string;
  beverageCategory: BeverageCategory;
  beverageType: string;
  producer: string;
  price: number;
  restaurantName: string;
  notes: string;
  addedAt: string;
}

export const [WishlistProvider, useWishlist] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) as WishlistItem[] : [];
    },
  });

  useEffect(() => {
    if (wishlistQuery.data) {
      setWishlistItems(wishlistQuery.data);
    }
  }, [wishlistQuery.data]);

  const saveWishlist = async (updatedWishlist: WishlistItem[]) => {
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
    setWishlistItems(updatedWishlist);
    queryClient.setQueryData(['wishlist'], updatedWishlist);
  };

  const addToWishlistMutation = useMutation({
    mutationFn: async (item: Omit<WishlistItem, 'id' | 'addedAt'>) => {
      const newItem: WishlistItem = {
        ...item,
        id: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date().toISOString(),
      };
      const updatedWishlist = [...wishlistItems, newItem];
      await saveWishlist(updatedWishlist);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return newItem;
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
      await saveWishlist(updatedWishlist);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      return itemId;
    },
  });

  const removeByBeverageIdMutation = useMutation({
    mutationFn: async (beverageId: string) => {
      const updatedWishlist = wishlistItems.filter(item => item.beverageId !== beverageId);
      await saveWishlist(updatedWishlist);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      return beverageId;
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      const updatedWishlist = wishlistItems.map(item =>
        item.id === itemId ? { ...item, notes } : item
      );
      await saveWishlist(updatedWishlist);
      return { itemId, notes };
    },
  });

  const clearWishlistMutation = useMutation({
    mutationFn: async () => {
      await saveWishlist([]);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const isInWishlist = useCallback((beverageId: string) => {
    return wishlistItems.some(item => item.beverageId === beverageId);
  }, [wishlistItems]);

  const getWishlistItem = useCallback((beverageId: string) => {
    return wishlistItems.find(item => item.beverageId === beverageId);
  }, [wishlistItems]);

  const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  const sortedWishlist = useMemo(() => {
    return [...wishlistItems].sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [wishlistItems]);

  return {
    wishlistItems: sortedWishlist,
    isLoading: wishlistQuery.isLoading,
    addToWishlist: addToWishlistMutation.mutateAsync,
    removeFromWishlist: removeFromWishlistMutation.mutateAsync,
    removeByBeverageId: removeByBeverageIdMutation.mutateAsync,
    updateNotes: updateNotesMutation.mutateAsync,
    clearWishlist: clearWishlistMutation.mutateAsync,
    isInWishlist,
    getWishlistItem,
    wishlistCount,
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
  };
});
