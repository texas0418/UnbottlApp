import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Wine, Beer, Spirit, Cocktail, NonAlcoholicBeverage } from '@/types';

const OFFLINE_CACHE_KEY = '@unbottl_offline_cache';
const CACHE_TIMESTAMP_KEY = '@unbottl_cache_timestamp';

export interface OfflineMenuCache {
  wines: Wine[];
  beers: Beer[];
  spirits: Spirit[];
  cocktails: Cocktail[];
  nonAlcoholic: NonAlcoholicBeverage[];
  restaurantName: string;
  restaurantCuisine: string;
  restaurantCoverImage: string | null;
  cachedAt: string;
}

export const [OfflineProvider, useOffline] = createContextHook(() => {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedMenu, setCachedMenu] = useState<OfflineMenuCache | null>(null);
  const [lastCacheTime, setLastCacheTime] = useState<Date | null>(null);
  const [isCaching, setIsCaching] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      console.log('[Offline] Network status changed:', online ? 'online' : 'offline');
      setIsOnline(online);
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      console.log('[Offline] Initial network status:', online ? 'online' : 'offline');
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadCachedMenu();
  }, []);

  const loadCachedMenu = async () => {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached) {
        const parsedCache = JSON.parse(cached) as OfflineMenuCache;
        setCachedMenu(parsedCache);
        console.log('[Offline] Loaded cached menu data');
      }
      
      if (timestamp) {
        setLastCacheTime(new Date(timestamp));
      }
    } catch (error) {
      console.error('[Offline] Error loading cached menu:', error);
    }
  };

  const cacheMenuData = useCallback(async (data: Omit<OfflineMenuCache, 'cachedAt'>) => {
    setIsCaching(true);
    try {
      const cacheData: OfflineMenuCache = {
        ...data,
        cachedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cacheData));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, cacheData.cachedAt);
      
      setCachedMenu(cacheData);
      setLastCacheTime(new Date(cacheData.cachedAt));
      console.log('[Offline] Menu data cached successfully');
    } catch (error) {
      console.error('[Offline] Error caching menu data:', error);
    } finally {
      setIsCaching(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      setCachedMenu(null);
      setLastCacheTime(null);
      console.log('[Offline] Cache cleared');
    } catch (error) {
      console.error('[Offline] Error clearing cache:', error);
    }
  }, []);

  const getCacheAge = useCallback(() => {
    if (!lastCacheTime) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastCacheTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  }, [lastCacheTime]);

  const hasCache = cachedMenu !== null;

  return {
    isOnline,
    isOffline: !isOnline,
    cachedMenu,
    hasCache,
    lastCacheTime,
    isCaching,
    cacheMenuData,
    clearCache,
    getCacheAge,
  };
});
