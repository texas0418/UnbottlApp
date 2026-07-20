import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

const RECENT_MENUS_STORAGE_KEY = '@unbottl_recent_menus';
const MAX_RECENT_MENUS = 20;

export interface RecentMenu {
  restaurantId: string;
  name: string;
  cuisineType: string | null;
  imageUrl: string | null;
  itemCount: number;
  viewedAt: string;
}

export const [RecentMenusProvider, useRecentMenus] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [recentMenus, setRecentMenus] = useState<RecentMenu[]>([]);

  const recentQuery = useQuery({
    queryKey: ['recentMenus'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(RECENT_MENUS_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as RecentMenu[]) : [];
    },
  });

  useEffect(() => {
    if (recentQuery.data) setRecentMenus(recentQuery.data);
  }, [recentQuery.data]);

  const persist = useCallback(
    async (next: RecentMenu[]) => {
      await AsyncStorage.setItem(RECENT_MENUS_STORAGE_KEY, JSON.stringify(next));
      setRecentMenus(next);
      queryClient.setQueryData(['recentMenus'], next);
    },
    [queryClient]
  );

  /**
   * Record that the user viewed a restaurant's menu. Moves the menu to the top
   * (de-duped by restaurantId) and, when signed in, best-effort logs the visit
   * to the `restaurant_visits` table. Local storage is the source of truth so
   * this works for guests and offline.
   */
  const recordView = useCallback(
    async (menu: Omit<RecentMenu, 'viewedAt'>) => {
      const entry: RecentMenu = { ...menu, viewedAt: new Date().toISOString() };
      const deduped = recentMenus.filter((m) => m.restaurantId !== menu.restaurantId);
      const next = [entry, ...deduped].slice(0, MAX_RECENT_MENUS);
      await persist(next);

      // Best-effort remote visit log — never blocks or throws into the UI.
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id;
        if (userId) {
          await supabase.from('restaurant_visits').upsert(
            {
              user_id: userId,
              restaurant_id: menu.restaurantId,
              visited_at: entry.viewedAt,
            },
            { onConflict: 'user_id,restaurant_id' }
          );
        }
      } catch {
        // Ignore — RLS/offline/table-missing all degrade to local-only history.
      }
    },
    [recentMenus, persist]
  );

  const clearRecentMenus = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return {
    recentMenus,
    isLoading: recentQuery.isLoading,
    recordView,
    clearRecentMenus,
  };
});
