import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Wine, Star, MapPin, Utensils, Heart, ChevronDown, ChevronUp, GitCompare, Plus, Check, WifiOff, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import FilterChips from '@/components/FilterChips';
import FlavorProfileSlider, { FlavorFilters } from '@/components/FlavorProfileSlider';
import { useComparison } from '@/contexts/ComparisonContext';
import { useOffline } from '@/contexts/OfflineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Wine as WineType } from '@/types';

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Red', value: 'red' },
  { label: 'White', value: 'white' },
  { label: 'Rosé', value: 'rose' },
  { label: 'Sparkling', value: 'sparkling' },
];

const DEFAULT_FLAVOR_FILTERS: FlavorFilters = {
  body: [1, 5],
  sweetness: [1, 5],
  tannins: [1, 5],
  acidity: [1, 5],
};

interface FavoriteButtonProps {
  wineId: string;
  size?: number;
}

interface CompareButtonProps {
  wine: WineType;
  size?: number;
}

function CompareButton({ wine, size = 18 }: CompareButtonProps) {
  const { isInCompare, addToCompare, removeFromCompare, canAddMore } = useComparison();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const inCompare = isInCompare(wine.id);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    
    if (inCompare) {
      removeFromCompare(wine.id);
    } else if (canAddMore) {
      addToCompare(wine);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={!inCompare && !canAddMore}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.compareButton, inCompare && styles.compareButtonActive]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {inCompare ? (
          <Check size={size - 4} color={Colors.white} />
        ) : (
          <Plus size={size - 4} color={canAddMore ? Colors.primary : Colors.textMuted} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function FavoriteButton({ wineId, size = 20 }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const favorite = isFavorite(wineId);

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    
    await toggleFavorite(wineId);
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={isToggling}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Heart 
          size={size} 
          color={favorite ? Colors.error : Colors.textMuted}
          fill={favorite ? Colors.error : 'transparent'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MenuPreviewScreen() {
  const router = useRouter();
  const { inStockWines, featuredWines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic } = useBeverages();
  const { favoriteIds, favoritesCount } = useFavorites();
  const { compareCount, clearCompare, maxCompareWines } = useComparison();
  const { restaurant } = useRestaurant();
  const { isOffline, cachedMenu, cacheMenuData, getCacheAge, hasCache } = useOffline();
  const [selectedType, setSelectedType] = useState('all');
  const [flavorFilters, setFlavorFilters] = useState<FlavorFilters>(DEFAULT_FLAVOR_FILTERS);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (!isOffline && inStockWines.length > 0) {
      cacheMenuData({
        wines: inStockWines,
        beers: beers.filter(b => b.inStock),
        spirits: spirits.filter(s => s.inStock),
        cocktails: cocktails.filter(c => c.isAvailable),
        nonAlcoholic: nonAlcoholic.filter(n => n.inStock),
        restaurantName: restaurant?.name || 'Wine Menu',
        restaurantCuisine: restaurant?.cuisineType || '',
        restaurantCoverImage: restaurant?.coverImageUrl || null,
      });
    }
  }, [isOffline, inStockWines, beers, spirits, cocktails, nonAlcoholic, restaurant, cacheMenuData]);

  const displayWines = useMemo(() => {
    if (isOffline && cachedMenu) {
      return cachedMenu.wines;
    }
    return inStockWines;
  }, [isOffline, cachedMenu, inStockWines]);

  const displayFeaturedWines = useMemo(() => {
    if (isOffline && cachedMenu) {
      return cachedMenu.wines.filter(w => w.featured);
    }
    return featuredWines;
  }, [isOffline, cachedMenu, featuredWines]);

  const displayRestaurant = useMemo(() => {
    if (isOffline && cachedMenu) {
      return {
        name: cachedMenu.restaurantName,
        cuisineType: cachedMenu.restaurantCuisine,
        coverImageUrl: cachedMenu.restaurantCoverImage,
      };
    }
    return restaurant;
  }, [isOffline, cachedMenu, restaurant]);

  const favoriteWines = useMemo(() => {
    return displayWines.filter(wine => favoriteIds.includes(wine.id));
  }, [displayWines, favoriteIds]);

  const filteredWines = useMemo(() => {
    let wines = selectedType === 'all' 
      ? displayWines 
      : displayWines.filter(w => w.type === selectedType);
    
    wines = wines.filter(w => {
      const fp = w.flavorProfile;
      if (!fp) return true;
      
      return (
        fp.body >= flavorFilters.body[0] && fp.body <= flavorFilters.body[1] &&
        fp.sweetness >= flavorFilters.sweetness[0] && fp.sweetness <= flavorFilters.sweetness[1] &&
        fp.tannins >= flavorFilters.tannins[0] && fp.tannins <= flavorFilters.tannins[1] &&
        fp.acidity >= flavorFilters.acidity[0] && fp.acidity <= flavorFilters.acidity[1]
      );
    });
    
    return wines;
  }, [displayWines, selectedType, flavorFilters]);

  const winesByType = filteredWines.reduce((acc, wine) => {
    if (!acc[wine.type]) {
      acc[wine.type] = [];
    }
    acc[wine.type].push(wine);
    return acc;
  }, {} as Record<string, typeof filteredWines>);

  const renderWineItem = (wine: WineType, showFavoriteButton = true, showCompareButton = true) => (
    <View key={wine.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemMain}>
          <Text style={styles.menuItemName}>{wine.name}</Text>
          {wine.vintage && <Text style={styles.menuItemVintage}>{wine.vintage}</Text>}
        </View>
        <View style={styles.menuItemRight}>
          {showCompareButton && <CompareButton wine={wine} size={18} />}
          {showFavoriteButton && <FavoriteButton wineId={wine.id} size={18} />}
          <View style={styles.menuItemPrices}>
            {wine.glassPrice && (
              <Text style={styles.glassPrice}>${wine.glassPrice}</Text>
            )}
            <Text style={styles.bottlePrice}>${wine.price}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.menuItemProducer}>{wine.producer}</Text>
      <View style={styles.menuItemDetails}>
        <MapPin size={12} color={Colors.textMuted} />
        <Text style={styles.menuItemRegion}>
          {wine.region}, {wine.country}
        </Text>
        <Text style={styles.menuItemGrape}>• {wine.grape}</Text>
      </View>
      {wine.tastingNotes && (
        <Text style={styles.menuItemNotes} numberOfLines={2}>
          {wine.tastingNotes}
        </Text>
      )}
      {wine.foodPairings.length > 0 && (
        <View style={styles.pairingsRow}>
          <Text style={styles.pairingsLabel}>Pairs with:</Text>
          <Text style={styles.pairingsText}>
            {wine.foodPairings.slice(0, 3).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.favoritesButton, favoritesCount > 0 && styles.favoritesButtonActive]}
            onPress={() => setShowFavorites(!showFavorites)}
          >
            <Heart 
              size={16} 
              color={favoritesCount > 0 ? Colors.error : Colors.textMuted} 
              fill={favoritesCount > 0 ? Colors.error : 'transparent'}
            />
            {favoritesCount > 0 && (
              <Text style={styles.favoritesCount}>{favoritesCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pairButton} 
            onPress={() => router.push('/dish-pairing')}
          >
            <Utensils size={16} color={Colors.white} />
            <Text style={styles.pairButtonText}>Pair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isOffline && (
          <OfflineIndicator showCacheInfo={true} />
        )}

        <View style={styles.hero}>
          {displayRestaurant?.coverImageUrl && (
            <Image 
              source={{ uri: displayRestaurant.coverImageUrl }} 
              style={styles.heroImage}
              contentFit="cover"
            />
          )}
          <View style={styles.heroOverlay}>
            <Text style={styles.restaurantName}>{displayRestaurant?.name || 'Wine Menu'}</Text>
            <Text style={styles.cuisineType}>{displayRestaurant?.cuisineType}</Text>
            {isOffline && hasCache && (
              <View style={styles.offlineBadge}>
                <WifiOff size={12} color={Colors.white} />
                <Text style={styles.offlineBadgeText}>Offline Mode</Text>
              </View>
            )}
          </View>
        </View>

        {showFavorites && (
          <View style={styles.favoritesSection}>
            <TouchableOpacity 
              style={styles.favoritesSectionHeader}
              onPress={() => setShowFavorites(false)}
            >
              <View style={styles.favoritesTitleRow}>
                <Heart size={20} color={Colors.error} fill={Colors.error} />
                <Text style={styles.favoritesSectionTitle}>My Favorites</Text>
                <View style={styles.favoritesBadge}>
                  <Text style={styles.favoritesBadgeText}>{favoritesCount}</Text>
                </View>
              </View>
              <ChevronUp size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            
            {favoriteWines.length === 0 ? (
              <View style={styles.emptyFavorites}>
                <Heart size={40} color={Colors.borderLight} />
                <Text style={styles.emptyFavoritesTitle}>No favorites yet</Text>
                <Text style={styles.emptyFavoritesText}>
                  Tap the heart icon on any wine to save it here
                </Text>
              </View>
            ) : (
              <View style={styles.favoritesListContainer}>
                {favoriteWines.map((wine) => renderWineItem(wine, true))}
              </View>
            )}
          </View>
        )}

        {!showFavorites && favoritesCount > 0 && (
          <TouchableOpacity 
            style={styles.favoritesCollapsed}
            onPress={() => setShowFavorites(true)}
          >
            <View style={styles.favoritesTitleRow}>
              <Heart size={18} color={Colors.error} fill={Colors.error} />
              <Text style={styles.favoritesCollapsedTitle}>My Favorites</Text>
              <View style={styles.favoritesBadge}>
                <Text style={styles.favoritesBadgeText}>{favoritesCount}</Text>
              </View>
            </View>
            <ChevronDown size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {displayFeaturedWines.length > 0 && selectedType === 'all' && !showFavorites && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={20} color={Colors.secondary} fill={Colors.secondary} />
              <Text style={styles.sectionTitle}>Sommelier&apos;s Selection</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {displayFeaturedWines.slice(0, 4).map((wine) => (
                <View key={wine.id} style={styles.featuredCard}>
                  <View style={styles.featuredCardHeader}>
                    <FavoriteButton wineId={wine.id} size={16} />
                  </View>
                  <View style={[styles.featuredImageContainer, { backgroundColor: wineTypeColors[wine.type] + '20' }]}>
                    {wine.imageUrl ? (
                      <Image source={{ uri: wine.imageUrl }} style={styles.featuredImage} contentFit="cover" />
                    ) : (
                      <Wine size={32} color={wineTypeColors[wine.type]} />
                    )}
                  </View>
                  <Text style={styles.featuredName} numberOfLines={2}>{wine.name}</Text>
                  <Text style={styles.featuredProducer} numberOfLines={1}>{wine.producer}</Text>
                  <Text style={styles.featuredPrice}>${wine.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {!showFavorites && (
          <>
            <View style={styles.filterSection}>
              <FilterChips
                options={filterOptions}
                selected={selectedType}
                onSelect={setSelectedType}
              />
            </View>

            <FlavorProfileSlider
              filters={flavorFilters}
              onFiltersChange={setFlavorFilters}
              matchCount={filteredWines.length}
            />

            {Object.entries(winesByType).map(([type, wines]) => (
              <View key={type} style={styles.section}>
                <View style={styles.typeSectionHeader}>
                  <View style={[styles.typeIndicator, { backgroundColor: wineTypeColors[type] }]} />
                  <Text style={styles.typeSectionTitle}>{wineTypeLabels[type]}</Text>
                  <Text style={styles.wineCount}>{wines.length}</Text>
                </View>
                
                {wines.map((wine) => renderWineItem(wine))}
              </View>
            ))}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Prices subject to change</Text>
          <Text style={styles.footerText}>Please inform your server of any allergies</Text>
          {hasCache && (
            <View style={styles.cacheStatus}>
              <Clock size={12} color={Colors.textMuted} />
              <Text style={styles.cacheStatusText}>Menu cached {getCacheAge()}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {compareCount > 0 && (
        <View style={styles.compareBar}>
          <View style={styles.compareBarContent}>
            <View style={styles.compareBarLeft}>
              <GitCompare size={20} color={Colors.white} />
              <Text style={styles.compareBarText}>
                {compareCount} of {maxCompareWines} wines
              </Text>
            </View>
            <View style={styles.compareBarActions}>
              <TouchableOpacity style={styles.clearCompareButton} onPress={clearCompare}>
                <Text style={styles.clearCompareText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.viewCompareButton, compareCount < 2 && styles.viewCompareButtonDisabled]} 
                onPress={() => router.push('/wine-comparison')}
                disabled={compareCount < 2}
              >
                <Text style={[styles.viewCompareText, compareCount < 2 && styles.viewCompareTextDisabled]}>
                  Compare
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  favoritesButtonActive: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error + '30',
  },
  favoritesCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pairButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  hero: {
    height: 200,
    backgroundColor: Colors.primary,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 24,
  },
  restaurantName: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  favoritesSection: {
    backgroundColor: Colors.error + '08',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  favoritesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '15',
  },
  favoritesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favoritesSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  favoritesBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  favoritesBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  favoritesListContainer: {
    padding: 16,
    paddingTop: 8,
  },
  emptyFavorites: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyFavoritesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  emptyFavoritesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  favoritesCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.error + '08',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  favoritesCollapsedTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  featuredCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredCardHeader: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  featuredImageContainer: {
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
    lineHeight: 18,
  },
  featuredProducer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  filterSection: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  typeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  typeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  typeSectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  wineCount: {
    fontSize: 14,
    color: Colors.textMuted,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  menuItem: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  menuItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginLeft: 12,
  },
  menuItemName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  menuItemVintage: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  menuItemPrices: {
    alignItems: 'flex-end',
  },
  glassPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bottlePrice: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  menuItemProducer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  menuItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  menuItemRegion: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  menuItemGrape: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  menuItemNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 8,
  },
  pairingsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pairingsLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  pairingsText: {
    fontSize: 12,
    color: Colors.secondary,
    flex: 1,
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  offlineBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  cacheStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cacheStatusText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
  compareButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareButtonActive: {
    backgroundColor: Colors.secondary,
  },
  compareBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingBottom: 34,
    paddingTop: 14,
    paddingHorizontal: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  compareBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compareBarText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  compareBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearCompareButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearCompareText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  viewCompareButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viewCompareButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  viewCompareText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  viewCompareTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});
