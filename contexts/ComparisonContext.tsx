import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Wine } from '@/types';

const MAX_COMPARE_WINES = 3;

export const [ComparisonProvider, useComparison] = createContextHook(() => {
  const [compareWines, setCompareWines] = useState<Wine[]>([]);

  const addToCompare = useCallback((wine: Wine) => {
    setCompareWines(prev => {
      if (prev.length >= MAX_COMPARE_WINES) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return prev;
      }
      if (prev.some(w => w.id === wine.id)) {
        return prev;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return [...prev, wine];
    });
  }, []);

  const removeFromCompare = useCallback((wineId: string) => {
    setCompareWines(prev => prev.filter(w => w.id !== wineId));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const clearCompare = useCallback(() => {
    setCompareWines([]);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const isInCompare = useCallback((wineId: string) => {
    return compareWines.some(w => w.id === wineId);
  }, [compareWines]);

  const canAddMore = useMemo(() => compareWines.length < MAX_COMPARE_WINES, [compareWines]);
  const compareCount = useMemo(() => compareWines.length, [compareWines]);

  return {
    compareWines,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore,
    compareCount,
    maxCompareWines: MAX_COMPARE_WINES,
  };
});
