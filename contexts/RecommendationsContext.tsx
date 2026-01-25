import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Wine, WineType, FlavorProfile } from '@/types';
import { useWines } from './WineContext';
import { useFavorites } from './FavoritesContext';
import { useJournal } from './JournalContext';

const PREFERENCES_STORAGE_KEY = '@unbottl_preferences';

export interface CustomerPreferences {
  preferredTypes: WineType[];
  priceRange: { min: number; max: number };
  flavorProfile: FlavorProfile;
  avoidHighTannins: boolean;
  preferOrganic: boolean;
  preferLocal: boolean;
  occasions: string[];
}

const defaultPreferences: CustomerPreferences = {
  preferredTypes: [],
  priceRange: { min: 0, max: 500 },
  flavorProfile: { body: 3, sweetness: 2, tannins: 3, acidity: 3 },
  avoidHighTannins: false,
  preferOrganic: false,
  preferLocal: false,
  occasions: [],
};

const defaultFlavorProfile: FlavorProfile = { body: 3, sweetness: 2, tannins: 3, acidity: 3 };

interface RecommendedWine extends Wine {
  matchScore: number;
  matchReasons: string[];
}

export const [RecommendationsProvider, useRecommendations] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { wines, inStockWines } = useWines();
  const { favoriteIds, isFavorite } = useFavorites();
  const { entries } = useJournal();
  const [preferences, setPreferences] = useState<CustomerPreferences>(defaultPreferences);
  const [hasSetPreferences, setHasSetPreferences] = useState(false);

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { preferences: parsed.preferences as CustomerPreferences, hasSet: true };
      }
      return { preferences: defaultPreferences, hasSet: false };
    },
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data.preferences);
      setHasSetPreferences(preferencesQuery.data.hasSet);
    }
  }, [preferencesQuery.data]);

  const savePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: CustomerPreferences) => {
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ preferences: newPreferences })
      );
      setPreferences(newPreferences);
      setHasSetPreferences(true);
      queryClient.setQueryData(['preferences'], { preferences: newPreferences, hasSet: true });
      return newPreferences;
    },
  });

  const clearPreferencesMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY);
      setPreferences(defaultPreferences);
      setHasSetPreferences(false);
      queryClient.setQueryData(['preferences'], { preferences: defaultPreferences, hasSet: false });
    },
  });

  const learnedPreferences = useMemo(() => {
    const typeCount: Record<WineType, number> = {
      red: 0, white: 0, rose: 0, sparkling: 0, dessert: 0, fortified: 0
    };
    const flavorSum = { body: 0, sweetness: 0, tannins: 0, acidity: 0 };
    let flavorCount = 0;
    let priceSum = 0;
    let priceCount = 0;

    favoriteIds.forEach(id => {
      const wine = wines.find(w => w.id === id);
      if (wine) {
        const fp = wine.flavorProfile || defaultFlavorProfile;
        typeCount[wine.type]++;
        flavorSum.body += fp.body;
        flavorSum.sweetness += fp.sweetness;
        flavorSum.tannins += fp.tannins;
        flavorSum.acidity += fp.acidity;
        flavorCount++;
        priceSum += wine.price;
        priceCount++;
      }
    });

    entries.filter(e => e.rating >= 4 && e.beverageCategory === 'wine').forEach(entry => {
      const wineType = entry.beverageType as WineType;
      if (wineType in typeCount) {
        typeCount[wineType]++;
      }
      const wine = wines.find(w => w.id === entry.beverageId);
      if (wine) {
        const fp = wine.flavorProfile || defaultFlavorProfile;
        flavorSum.body += fp.body;
        flavorSum.sweetness += fp.sweetness;
        flavorSum.tannins += fp.tannins;
        flavorSum.acidity += fp.acidity;
        flavorCount++;
        priceSum += wine.price;
        priceCount++;
      }
    });

    const preferredTypes = Object.entries(typeCount)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type as WineType);

    const avgFlavor = flavorCount > 0 ? {
      body: Math.round(flavorSum.body / flavorCount),
      sweetness: Math.round(flavorSum.sweetness / flavorCount),
      tannins: Math.round(flavorSum.tannins / flavorCount),
      acidity: Math.round(flavorSum.acidity / flavorCount),
    } : null;

    const avgPrice = priceCount > 0 ? Math.round(priceSum / priceCount) : null;

    return { preferredTypes, avgFlavor, avgPrice };
  }, [favoriteIds, entries, wines]);

  const calculateMatchScore = useCallback((wine: Wine): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];
    const effectivePrefs = hasSetPreferences ? preferences : {
      ...defaultPreferences,
      preferredTypes: learnedPreferences.preferredTypes,
      flavorProfile: learnedPreferences.avgFlavor || defaultPreferences.flavorProfile,
    };

    if (effectivePrefs.preferredTypes.length > 0) {
      if (effectivePrefs.preferredTypes.includes(wine.type)) {
        score += 25;
        reasons.push(`Matches your preferred ${wine.type} style`);
      }
    }

    if (wine.price >= effectivePrefs.priceRange.min && wine.price <= effectivePrefs.priceRange.max) {
      score += 15;
    } else if (wine.price < effectivePrefs.priceRange.min) {
      score += 5;
      reasons.push('Great value option');
    }

    const fp = wine.flavorProfile || defaultFlavorProfile;
    const flavorDiff = 
      Math.abs(fp.body - effectivePrefs.flavorProfile.body) +
      Math.abs(fp.sweetness - effectivePrefs.flavorProfile.sweetness) +
      Math.abs(fp.tannins - effectivePrefs.flavorProfile.tannins) +
      Math.abs(fp.acidity - effectivePrefs.flavorProfile.acidity);
    
    const flavorScore = Math.max(0, 30 - (flavorDiff * 3));
    score += flavorScore;
    
    if (flavorScore >= 24) {
      reasons.push('Matches your flavor preferences');
    }

    if (effectivePrefs.avoidHighTannins && fp.tannins >= 4) {
      score -= 20;
    }

    if (isFavorite(wine.id)) {
      score += 10;
      reasons.push('One of your favorites');
    }

    const journalEntry = entries.find(e => e.beverageId === wine.id);
    if (journalEntry) {
      if (journalEntry.rating >= 4) {
        score += 15;
        reasons.push(`You rated this ${journalEntry.rating}/5`);
      } else if (journalEntry.rating <= 2) {
        score -= 15;
      }
    }

    if (wine.featured) {
      score += 5;
      if (!reasons.some(r => r.includes('featured'))) {
        reasons.push('Staff pick');
      }
    }

    const similarFavorites = favoriteIds.filter(id => {
      const favWine = wines.find(w => w.id === id);
      return favWine && favWine.type === wine.type && favWine.id !== wine.id;
    });
    if (similarFavorites.length > 0) {
      score += 10;
      reasons.push('Similar to wines you love');
    }

    return { score: Math.min(100, Math.max(0, score)), reasons };
  }, [hasSetPreferences, preferences, learnedPreferences, isFavorite, entries, favoriteIds, wines]);

  const recommendations = useMemo((): RecommendedWine[] => {
    const scoredWines = inStockWines.map(wine => {
      const { score, reasons } = calculateMatchScore(wine);
      return { ...wine, matchScore: score, matchReasons: reasons };
    });

    return scoredWines
      .filter(w => w.matchScore > 20)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }, [inStockWines, calculateMatchScore]);

  const topPicks = useMemo(() => recommendations.slice(0, 3), [recommendations]);

  const getRecommendationsForOccasion = useCallback((occasion: string): RecommendedWine[] => {
    const occasionKeywords: Record<string, { types: WineType[]; keywords: string[] }> = {
      'dinner party': { types: ['red', 'white'], keywords: ['elegant', 'refined', 'complex'] },
      'celebration': { types: ['sparkling'], keywords: ['champagne', 'celebration', 'special'] },
      'casual': { types: ['rose', 'white'], keywords: ['refreshing', 'easy', 'light'] },
      'romantic': { types: ['red', 'sparkling'], keywords: ['smooth', 'elegant'] },
      'summer': { types: ['rose', 'white', 'sparkling'], keywords: ['crisp', 'refreshing', 'light'] },
      'winter': { types: ['red', 'fortified'], keywords: ['rich', 'warming', 'full'] },
    };

    const config = occasionKeywords[occasion.toLowerCase()];
    if (!config) return recommendations;

    return inStockWines
      .filter(w => config.types.includes(w.type))
      .map(wine => {
        const { score, reasons } = calculateMatchScore(wine);
        const hasKeyword = config.keywords.some(k => 
          wine.tastingNotes.toLowerCase().includes(k)
        );
        return {
          ...wine,
          matchScore: score + (hasKeyword ? 10 : 0),
          matchReasons: hasKeyword 
            ? [...reasons, `Perfect for ${occasion}`] 
            : reasons,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }, [inStockWines, calculateMatchScore, recommendations]);

  const getSimilarWines = useCallback((wineId: string): RecommendedWine[] => {
    const baseWine = wines.find(w => w.id === wineId);
    if (!baseWine) return [];

    return inStockWines
      .filter(w => w.id !== wineId)
      .map(wine => {
        let score = 0;
        const reasons: string[] = [];

        if (wine.type === baseWine.type) {
          score += 30;
          reasons.push(`Same wine type`);
        }

        if (wine.grape === baseWine.grape) {
          score += 20;
          reasons.push(`Same grape variety`);
        }

        if (wine.region === baseWine.region) {
          score += 15;
          reasons.push(`Same region`);
        }

        const wineFp = wine.flavorProfile || defaultFlavorProfile;
        const baseFp = baseWine.flavorProfile || defaultFlavorProfile;
        const flavorDiff = 
          Math.abs(wineFp.body - baseFp.body) +
          Math.abs(wineFp.sweetness - baseFp.sweetness) +
          Math.abs(wineFp.tannins - baseFp.tannins) +
          Math.abs(wineFp.acidity - baseFp.acidity);
        
        if (flavorDiff <= 4) {
          score += 25;
          reasons.push('Similar flavor profile');
        }

        const priceDiff = Math.abs(wine.price - baseWine.price) / baseWine.price;
        if (priceDiff <= 0.3) {
          score += 10;
          reasons.push('Similar price range');
        }

        return { ...wine, matchScore: score, matchReasons: reasons };
      })
      .filter(w => w.matchScore > 20)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }, [wines, inStockWines]);

  return {
    preferences,
    hasSetPreferences,
    learnedPreferences,
    recommendations,
    topPicks,
    isLoading: preferencesQuery.isLoading,
    savePreferences: savePreferencesMutation.mutateAsync,
    clearPreferences: clearPreferencesMutation.mutateAsync,
    getRecommendationsForOccasion,
    getSimilarWines,
    isSaving: savePreferencesMutation.isPending,
  };
});
