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
import { useRouter } from 'expo-router';
import { Wine, Beer, Martini, Coffee, GlassWater, Package, Filter, Leaf, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { BeverageCategory, Wine as WineType, DietaryTag, dietaryTagColors } from '@/types';
import WineCard from '@/components/WineCard';
import BeverageCard from '@/components/BeverageCard';
import SearchBar from '@/components/SearchBar';
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

export default function CatalogScreen() {
  const router = useRouter();
  const { wines, isLoading: winesLoading } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic, isLoading: beveragesLoading } = useBeverages();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>('all');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<DietaryTag[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = winesLoading || beveragesLoading;

  const getTypeFilters = () => {
    switch (selectedCategory) {
      case 'wine':
        return wineTypeFilters;
      case 'beer':
        return beerTypeFilters;
      case 'spirit':
        return spiritTypeFilters;
      case 'cocktail':
        return cocktailTypeFilters;
      case 'non-alcoholic':
        return nonAlcTypeFilters;
      default:
        return [];
    }
  };

  const allItems = useMemo((): CatalogItem[] => {
    const items: CatalogItem[] = [];

    wines.forEach(wine => {
      items.push({
        id: wine.id,
        category: 'wine',
        data: wine,
        name: wine.name,
        searchText: `${wine.name} ${wine.producer} ${wine.region} ${wine.grape} ${wine.type}`.toLowerCase(),
      });
    });

    beers.forEach(beer => {
      items.push({
        id: beer.id,
        category: 'beer',
        data: beer,
        name: beer.name,
        searchText: `${beer.name} ${beer.brewery} ${beer.origin} ${beer.style} ${beer.type}`.toLowerCase(),
      });
    });

    spirits.forEach(spirit => {
      items.push({
        id: spirit.id,
        category: 'spirit',
        data: spirit,
        name: spirit.name,
        searchText: `${spirit.name} ${spirit.brand} ${spirit.origin} ${spirit.type}`.toLowerCase(),
      });
    });

    cocktails.forEach(cocktail => {
      items.push({
        id: cocktail.id,
        category: 'cocktail',
        data: cocktail,
        name: cocktail.name,
        searchText: `${cocktail.name} ${cocktail.baseSpirit} ${cocktail.type} ${cocktail.ingredients.join(' ')}`.toLowerCase(),
      });
    });

    nonAlcoholic.forEach(na => {
      items.push({
        id: na.id,
        category: 'non-alcoholic',
        data: na,
        name: na.name,
        searchText: `${na.name} ${na.brand || ''} ${na.type}`.toLowerCase(),
      });
    });

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
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const hasActiveFilters = selectedPriceRange !== 'all' || selectedType !== 'all' || selectedDietaryTags.length > 0;

  const handleItemPress = (item: CatalogItem) => {
    if (item.category === 'wine') {
      router.push(`/wine/${item.id}`);
    } else {
      router.push(`/beverage/${item.category}/${item.id}`);
    }
  };

  const getCategoryStats = () => {
    const counts = {
      all: allItems.length,
      wine: wines.length,
      beer: beers.length,
      spirit: spirits.length,
      cocktail: cocktails.length,
      'non-alcoholic': nonAlcoholic.length,
    };
    return counts;
  };

  const stats = getCategoryStats();

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsContainer}
    >
      {categoryTabs.map((tab) => {
        const isSelected = selectedCategory === tab.value;
        const count = stats[tab.value as keyof typeof stats];
        return (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.categoryTab,
              isSelected && styles.categoryTabSelected,
            ]}
            onPress={() => handleCategoryChange(tab.value)}
          >
            <View style={styles.categoryTabIcon}>
              {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                color: isSelected ? Colors.white : Colors.textSecondary,
              })}
            </View>
            <Text style={[
              styles.categoryTabLabel,
              isSelected && styles.categoryTabLabelSelected,
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.categoryBadge,
              isSelected && styles.categoryBadgeSelected,
            ]}>
              <Text style={[
                styles.categoryBadgeText,
                isSelected && styles.categoryBadgeTextSelected,
              ]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderPriceFilters = () => (
    <View style={styles.priceFilterRow}>
      <Text style={styles.priceFilterLabel}>Budget</Text>
      <View style={styles.priceChipsContainer}>
        {priceRangeFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.priceChip,
              selectedPriceRange === filter.value && styles.priceChipSelected,
            ]}
            onPress={() => setSelectedPriceRange(filter.value)}
          >
            <Text style={[
              styles.priceChipText,
              selectedPriceRange === filter.value && styles.priceChipTextSelected,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDietaryFilters = () => (
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dietaryChipsContainer}
      >
        {dietaryFilters.map((filter) => {
          const isSelected = selectedDietaryTags.includes(filter.value);
          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.dietaryChip,
                isSelected && { backgroundColor: dietaryTagColors[filter.value], borderColor: dietaryTagColors[filter.value] },
              ]}
              onPress={() => toggleDietaryTag(filter.value)}
            >
              <Text style={styles.dietaryChipIcon}>{filter.icon}</Text>
              <Text style={[
                styles.dietaryChipText,
                isSelected && styles.dietaryChipTextSelected,
              ]}>
                {filter.label}
              </Text>
              {isSelected && (
                <X size={12} color={Colors.white} style={styles.dietaryChipX} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTypeFilters = () => {
    const filters = getTypeFilters();
    if (filters.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeFiltersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.typeChip,
              selectedType === filter.value && styles.typeChipSelected,
            ]}
            onPress={() => setSelectedType(filter.value)}
          >
            <Text style={[
              styles.typeChipText,
              selectedType === filter.value && styles.typeChipTextSelected,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search drinks..."
        />
      </View>
      {renderCategoryTabs()}
      {renderPriceFilters()}
      {renderDietaryFilters()}
      {renderTypeFilters()}
      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          {filteredItems.length} {filteredItems.length === 1 ? 'drink' : 'drinks'} available
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
    </View>
  );

  const renderItem = ({ item }: { item: CatalogItem }) => {
    if (item.category === 'wine') {
      return (
        <View style={styles.cardContainer}>
          <WineCard
            wine={item.data as WineType}
            onPress={() => handleItemPress(item)}
          />
        </View>
      );
    }
    return (
      <View style={styles.cardContainer}>
        <BeverageCard
          beverage={item.data}
          category={item.category}
          onPress={() => handleItemPress(item)}
        />
      </View>
    );
  };

  if (!isLoading && allItems.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <EmptyState
          icon={Package}
          title="No drinks available"
          description="Check back later for our beverage selection."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.category}-${item.id}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchTitle}>No drinks found</Text>
            <Text style={styles.emptySearchText}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    gap: 12,
    marginBottom: 8,
    paddingTop: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
  },
  categoryTabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
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
  categoryTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabIcon: {
    width: 20,
    alignItems: 'center',
  },
  categoryTabLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryTabLabelSelected: {
    color: Colors.white,
  },
  categoryBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryBadgeTextSelected: {
    color: Colors.white,
  },
  priceFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  priceFilterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  priceChipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  priceChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  priceChipTextSelected: {
    color: Colors.white,
  },
  dietaryFilterSection: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dietaryFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dietaryFilterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  dietaryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  dietaryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  dietaryChipsContainer: {
    gap: 8,
    paddingRight: 20,
  },
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
  dietaryChipIcon: {
    fontSize: 14,
  },
  dietaryChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  dietaryChipTextSelected: {
    color: Colors.white,
  },
  dietaryChipX: {
    marginLeft: 2,
  },
  typeFiltersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  typeChipTextSelected: {
    color: Colors.white,
  },
  resultInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  resultText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
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
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 16,
  },
  cardContainer: {
    flex: 1,
  },
  emptySearch: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
