import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Wine,
  Beer,
  Martini,
  Coffee,
  GlassWater,
  Package,
  Filter,
  Leaf,
  X,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Settings2,
  Zap,
  Clock,
  QrCode,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useBeverages } from '@/contexts/BeverageContext';
import { useRecentMenus } from '@/contexts/RecentMenusContext';
import { useRecommendations } from '@/contexts/RecommendationsContext';
import { BeverageCategory, Wine as WineType, DietaryTag, dietaryTagColors } from '@/types';
import WineCard from '@/components/WineCard';
import BeverageCard from '@/components/BeverageCard';
import SearchBar from '@/components/SearchBar';
import PreferencesSetup from '@/components/PreferencesSetup';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import EmptyState from '@/components/EmptyState';
import { categoryColors } from '@/mocks/beverages';

const categoryTabs: { label: string; value: BeverageCategory | 'all'; icon: React.ReactNode }[] = [
  { label: 'All', value: 'all', icon: <Package size={18} color={Colors.textSecondary} /> },
  { label: 'Wine', value: 'wine', icon: <Wine size={18} color={categoryColors.wine} /> },
  { label: 'Beer', value: 'beer', icon: <Beer size={18} color={categoryColors.beer} /> },
  { label: 'Spirits', value: 'spirit', icon: <GlassWater size={18} color={categoryColors.spirit} /> },
  { label: 'Cocktails', value: 'cocktail', icon: <Martini size={18} color={categoryColors.cocktail} /> },
  { label: 'Non-Alc', value: 'non-alcoholic', icon: <Coffee size={18} color={categoryColors['non-alcoholic']} /> },
];

const wineTypeFilters = [
  { label: 'All', value: 'all' },
  { label: 'Red', value: 'red' },
  { label: 'White', value: 'white' },
  { label: 'Rosé', value: 'rose' },
  { label: 'Sparkling', value: 'sparkling' },
];
const beerTypeFilters = [
  { label: 'All', value: 'all' },
  { label: 'IPA', value: 'ipa' },
  { label: 'Lager', value: 'lager' },
  { label: 'Stout', value: 'stout' },
  { label: 'Wheat', value: 'wheat' },
  { label: 'Pilsner', value: 'pilsner' },
];
const spiritTypeFilters = [
  { label: 'All', value: 'all' },
  { label: 'Whiskey', value: 'whiskey' },
  { label: 'Vodka', value: 'vodka' },
  { label: 'Gin', value: 'gin' },
  { label: 'Tequila', value: 'tequila' },
  { label: 'Rum', value: 'rum' },
];
const cocktailTypeFilters = [
  { label: 'All', value: 'all' },
  { label: 'Signature', value: 'signature' },
  { label: 'Classic', value: 'classic' },
  { label: 'Seasonal', value: 'seasonal' },
];
const nonAlcTypeFilters = [
  { label: 'All', value: 'all' },
  { label: 'Coffee', value: 'coffee' },
  { label: 'Tea', value: 'tea' },
  { label: 'Juice', value: 'juice' },
  { label: 'Mocktail', value: 'mocktail' },
  { label: 'Water', value: 'water' },
];

type PriceRange = 'all' | '$' | '$$' | '$$$';
const priceRangeFilters: { label: string; value: PriceRange; min: number; max: number | null }[] = [
  { label: 'All', value: 'all', min: 0, max: null },
  { label: '$', value: '$', min: 0, max: 10 },
  { label: '$$', value: '$$', min: 10, max: 20 },
  { label: '$$$', value: '$$$', min: 20, max: null },
];

const dietaryFilters: { label: string; value: DietaryTag; icon: string }[] = [
  { label: 'Vegan', value: 'vegan', icon: '🌱' },
  { label: 'Organic', value: 'organic', icon: '🍃' },
  { label: 'Low Sulfite', value: 'low-sulfite', icon: '🧪' },
  { label: 'Gluten-Free', value: 'gluten-free', icon: '🌾' },
  { label: 'Natural', value: 'natural', icon: '🍇' },
  { label: 'Biodynamic', value: 'biodynamic', icon: '🌿' },
];

type CatalogItem = {
  id: string;
  category: BeverageCategory;
  data: any;
  name: string;
  searchText: string;
};

// eslint-disable-next-line max-lines-per-function -- tracked in #2
export default function DiscoverScreen() {
  const router = useRouter();
  const { wines, beers, spirits, cocktails, nonAlcoholic, isLoading } = useBeverages();
  const { topPicks, learnedPreferences } = useRecommendations();
  const { recentMenus } = useRecentMenus();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>('all');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<DietaryTag[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const hasRecommendations = topPicks.length > 0 || learnedPreferences.preferredTypes.length > 0;

  const getTypeFilters = () => {
    switch (selectedCategory) {
      case 'wine': return wineTypeFilters;
      case 'beer': return beerTypeFilters;
      case 'spirit': return spiritTypeFilters;
      case 'cocktail': return cocktailTypeFilters;
      case 'non-alcoholic': return nonAlcTypeFilters;
      default: return [];
    }
  };

  const allItems = useMemo((): CatalogItem[] => {
    const items: CatalogItem[] = [];
    wines.forEach(wine => items.push({
      id: wine.id, category: 'wine', data: wine, name: wine.name,
      searchText: `${wine.name} ${wine.producer} ${wine.region} ${wine.grape} ${wine.type}`.toLowerCase(),
    }));
    beers.forEach(beer => items.push({
      id: beer.id, category: 'beer', data: beer, name: beer.name,
      searchText: `${beer.name} ${beer.brewery} ${beer.origin} ${beer.style} ${beer.type}`.toLowerCase(),
    }));
    spirits.forEach(spirit => items.push({
      id: spirit.id, category: 'spirit', data: spirit, name: spirit.name,
      searchText: `${spirit.name} ${spirit.brand} ${spirit.origin} ${spirit.type}`.toLowerCase(),
    }));
    cocktails.forEach(cocktail => items.push({
      id: cocktail.id, category: 'cocktail', data: cocktail, name: cocktail.name,
      searchText: `${cocktail.name} ${cocktail.baseSpirit} ${cocktail.type} ${cocktail.ingredients.join(' ')}`.toLowerCase(),
    }));
    nonAlcoholic.forEach(na => items.push({
      id: na.id, category: 'non-alcoholic', data: na, name: na.name,
      searchText: `${na.name} ${na.brand || ''} ${na.type}`.toLowerCase(),
    }));
    return items;
  }, [wines, beers, spirits, cocktails, nonAlcoholic]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = searchQuery === '' || item.searchText.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      let matchesType = true;
      if (selectedType !== 'all' && selectedCategory !== 'all') {
        matchesType = item.data.type === selectedType;
      }
      let matchesPrice = true;
      if (selectedPriceRange !== 'all') {
        const priceFilter = priceRangeFilters.find(f => f.value === selectedPriceRange);
        if (priceFilter) {
          const itemPrice = item.data.price;
          matchesPrice = itemPrice >= priceFilter.min && (priceFilter.max === null || itemPrice < priceFilter.max);
        }
      }
      let matchesDietary = true;
      if (selectedDietaryTags.length > 0) {
        const itemTags = item.data.dietaryTags || [];
        matchesDietary = selectedDietaryTags.every(tag => itemTags.includes(tag));
      }
      return matchesSearch && matchesCategory && matchesType && matchesPrice && matchesDietary;
    });
  }, [allItems, searchQuery, selectedCategory, selectedType, selectedPriceRange, selectedDietaryTags]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleCategoryChange = (category: BeverageCategory | 'all') => {
    setSelectedCategory(category);
    setSelectedType('all');
  };

  const handleClearFilters = () => {
    setSelectedPriceRange('all');
    setSelectedType('all');
    setSelectedDietaryTags([]);
  };

  const toggleDietaryTag = (tag: DietaryTag) => {
    setSelectedDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters = selectedPriceRange !== 'all' || selectedType !== 'all' || selectedDietaryTags.length > 0;

  const handleItemPress = (item: CatalogItem) => {
    if (item.category === 'wine') router.push(`/wine/${item.id}`);
    else router.push(`/beverage/${item.category}/${item.id}`);
  };

  const stats: Record<string, number> = {
    all: allItems.length,
    wine: wines.length,
    beer: beers.length,
    spirit: spirits.length,
    cocktail: cocktails.length,
    'non-alcoholic': nonAlcoholic.length,
  };

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greetingHeader}>
        <Text style={styles.greeting}>Discover</Text>
        <Text style={styles.greetingSub}>Find your next favorite drink</Text>
      </View>

      {/* AI Sommelier */}
      <TouchableOpacity
        style={styles.sommelierBanner}
        onPress={() => router.push('/sommelier-chat')}
        activeOpacity={0.9}
      >
        <View style={styles.sommelierInner}>
          <View style={styles.sommelierIcon}>
            <MessageCircle size={26} color={Colors.white} />
          </View>
          <View style={styles.sommelierText}>
            <Text style={styles.sommelierTitle}>Ask the AI Sommelier</Text>
            <Text style={styles.sommelierSubtitle}>Tell me what you&apos;re in the mood for</Text>
          </View>
          <View style={styles.sommelierArrow}>
            <ArrowRight size={18} color={Colors.white} />
          </View>
        </View>
      </TouchableOpacity>

      {/* For You */}
      <View style={styles.forYouHeader}>
        <View style={styles.forYouTitleRow}>
          <View style={styles.sparkleIcon}>
            <Sparkles size={16} color={Colors.secondary} />
          </View>
          <Text style={styles.forYouTitle}>For You</Text>
        </View>
        <TouchableOpacity style={styles.prefsButton} onPress={() => setShowPreferences(true)}>
          <Settings2 size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {hasRecommendations ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forYouList}
        >
          {topPicks.map((wine) => (
            <TouchableOpacity
              key={wine.id}
              style={styles.recCard}
              onPress={() => router.push(`/wine/${wine.id}`)}
              activeOpacity={0.7}
            >
              {typeof wine.matchScore === 'number' && (
                <View style={styles.recBadge}>
                  <Zap size={11} color={Colors.white} />
                  <Text style={styles.recBadgeText}>{wine.matchScore}%</Text>
                </View>
              )}
              <Image
                source={{ uri: wine.imageUrl || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400' }}
                style={styles.recImage}
                contentFit="cover"
              />
              <View style={styles.recInfo}>
                <Text style={styles.recName} numberOfLines={1}>{wine.name}</Text>
                <Text style={styles.recProducer} numberOfLines={1}>{wine.producer}</Text>
                <Text style={styles.recPrice}>${wine.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity style={styles.setupCard} onPress={() => setShowPreferences(true)}>
          <View style={styles.setupIcon}>
            <Sparkles size={22} color={Colors.secondary} />
          </View>
          <View style={styles.setupTextWrap}>
            <Text style={styles.setupTitle}>Get personalized picks</Text>
            <Text style={styles.setupSubtitle}>Tell us your taste and we&apos;ll suggest drinks you&apos;ll love</Text>
          </View>
          <ArrowRight size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Recently viewed menus */}
      {recentMenus.length > 0 && (
        <>
          <View style={styles.recentHeader}>
            <View style={styles.recentTitleRow}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.recentTitle}>Recently viewed menus</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          >
            {recentMenus.map((menu) => (
              <TouchableOpacity
                key={menu.restaurantId}
                style={styles.recentCard}
                onPress={() =>
                  router.push({ pathname: '/customer-menu', params: { r: menu.restaurantId } })
                }
                activeOpacity={0.75}
              >
                <View style={styles.recentThumb}>
                  {menu.imageUrl ? (
                    <Image source={{ uri: menu.imageUrl }} style={styles.recentThumbImg} contentFit="cover" />
                  ) : (
                    <QrCode size={22} color={Colors.primary} />
                  )}
                </View>
                <Text style={styles.recentName} numberOfLines={1}>{menu.name}</Text>
                <Text style={styles.recentMeta} numberOfLines={1}>
                  {menu.cuisineType ? `${menu.cuisineType} · ` : ''}{menu.itemCount} drinks
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Browse — hidden when the catalog is empty so the first-run
          "Scan a menu" empty state sits up front instead of below a wall
          of filters that have nothing to filter. */}
      {allItems.length > 0 && (
        <>
      <Text style={styles.browseTitle}>Browse all drinks</Text>
      <View style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search drinks..." />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsContainer}>
        {categoryTabs.map((tab) => {
          const isSelected = selectedCategory === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
              onPress={() => handleCategoryChange(tab.value)}
            >
              <View style={styles.categoryTabIcon}>
                {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                  color: isSelected ? Colors.white : Colors.textSecondary,
                })}
              </View>
              <Text style={[styles.categoryTabLabel, isSelected && styles.categoryTabLabelSelected]}>{tab.label}</Text>
              <View style={[styles.categoryBadge, isSelected && styles.categoryBadgeSelected]}>
                <Text style={[styles.categoryBadgeText, isSelected && styles.categoryBadgeTextSelected]}>
                  {stats[tab.value]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.priceFilterRow}>
        <Text style={styles.priceFilterLabel}>Budget</Text>
        <View style={styles.priceChipsContainer}>
          {priceRangeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.priceChip, selectedPriceRange === filter.value && styles.priceChipSelected]}
              onPress={() => setSelectedPriceRange(filter.value)}
            >
              <Text style={[styles.priceChipText, selectedPriceRange === filter.value && styles.priceChipTextSelected]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.dietaryFilterSection}>
        <View style={styles.dietaryFilterHeader}>
          <Leaf size={16} color={Colors.textSecondary} />
          <Text style={styles.dietaryFilterLabel}>Dietary</Text>
          {selectedDietaryTags.length > 0 && (
            <View style={styles.dietaryBadge}>
              <Text style={styles.dietaryBadgeText}>{selectedDietaryTags.length}</Text>
            </View>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietaryChipsContainer}>
          {dietaryFilters.map((filter) => {
            const isSelected = selectedDietaryTags.includes(filter.value);
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.dietaryChip, isSelected && { backgroundColor: dietaryTagColors[filter.value], borderColor: dietaryTagColors[filter.value] }]}
                onPress={() => toggleDietaryTag(filter.value)}
              >
                <Text style={styles.dietaryChipIcon}>{filter.icon}</Text>
                <Text style={[styles.dietaryChipText, isSelected && styles.dietaryChipTextSelected]}>{filter.label}</Text>
                {isSelected && <X size={12} color={Colors.white} style={styles.dietaryChipX} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {getTypeFilters().length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeFiltersContainer}>
          {getTypeFilters().map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.typeChip, selectedType === filter.value && styles.typeChipSelected]}
              onPress={() => setSelectedType(filter.value)}
            >
              <Text style={[styles.typeChipText, selectedType === filter.value && styles.typeChipTextSelected]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          {filteredItems.length} {filteredItems.length === 1 ? 'drink' : 'drinks'}
        </Text>
        {hasActiveFilters ? (
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.filterIndicator}>
            <Filter size={14} color={Colors.textSecondary} />
          </View>
        )}
      </View>
        </>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: CatalogItem }) => (
    <View style={styles.cardContainer}>
      {item.category === 'wine' ? (
        <WineCard wine={item.data as WineType} onPress={() => handleItemPress(item)} quickSave />
      ) : (
        <BeverageCard beverage={item.data} category={item.category} onPress={() => handleItemPress(item)} quickSave />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AgeVerificationModal />
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.category}-${item.id}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          allItems.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="No drinks yet"
              description="Scan a restaurant's Unbottl QR code to browse its menu, save drinks you love, and build your taste profile."
              actionLabel="Scan a menu"
              onAction={() => router.push('/scan-menu')}
            />
          ) : (
            <EmptyState
              icon={Filter}
              title="No drinks found"
              description="Try adjusting your search or filters to find what you're looking for."
            />
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
      <PreferencesSetup visible={showPreferences} onClose={() => setShowPreferences(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: 24 },
  row: { paddingHorizontal: 20, gap: 16, marginBottom: 16 },
  cardContainer: { flex: 1 },
  greetingHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  greeting: { fontSize: 28, fontWeight: '700' as const, color: Colors.primary, letterSpacing: -0.5 },
  greetingSub: { fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
  sommelierBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  sommelierInner: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  sommelierIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sommelierText: { flex: 1 },
  sommelierTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.white, marginBottom: 2 },
  sommelierSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  sommelierArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forYouHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  forYouTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sparkleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forYouTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  prefsButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forYouList: { paddingHorizontal: 20, gap: 14, paddingRight: 20 },
  recCard: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  recBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recBadgeText: { fontSize: 10, fontWeight: '600' as const, color: Colors.white },
  recImage: { width: '100%', height: 110 },
  recInfo: { padding: 12 },
  recName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 },
  recProducer: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  recPrice: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  setupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupTextWrap: { flex: 1 },
  setupTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 },
  setupSubtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  recentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  recentList: { paddingHorizontal: 20, gap: 12, paddingRight: 20 },
  recentCard: { width: 130 },
  recentThumb: {
    width: 130,
    height: 90,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  recentThumbImg: { width: '100%', height: '100%' },
  recentName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  recentMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  browseTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  categoryTabsContainer: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTabSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryTabIcon: { width: 20, alignItems: 'center' },
  categoryTabLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  categoryTabLabelSelected: { color: Colors.white },
  categoryBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  categoryBadgeTextSelected: { color: Colors.white },
  priceFilterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  priceFilterLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  priceChipsContainer: { flexDirection: 'row', gap: 8 },
  priceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceChipSelected: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  priceChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  priceChipTextSelected: { color: Colors.white },
  dietaryFilterSection: { paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  dietaryFilterHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dietaryFilterLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  dietaryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  dietaryBadgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.white },
  dietaryChipsContainer: { gap: 8, paddingRight: 20 },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    gap: 4,
  },
  dietaryChipIcon: { fontSize: 14 },
  dietaryChipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSecondary },
  dietaryChipTextSelected: { color: Colors.white },
  dietaryChipX: { marginLeft: 2 },
  typeFiltersContainer: { paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typeChipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSecondary },
  typeChipTextSelected: { color: Colors.white },
  resultInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  resultText: { fontSize: 14, color: Colors.textSecondary },
  filterIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearFiltersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.error + '15',
  },
  clearFiltersText: { fontSize: 12, fontWeight: '600' as const, color: Colors.error },
  emptySearch: { padding: 40, alignItems: 'center' },
  emptySearchTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
  emptySearchText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
