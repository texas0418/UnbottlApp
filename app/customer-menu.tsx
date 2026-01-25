import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  X,
  Wine,
  Beer,
  Martini,
  Coffee,
  GlassWater,
  Star,
  MapPin,
  Flame,
  Leaf,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import { BeverageCategory } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CategoryTab = 'all' | BeverageCategory;

const categoryConfig: Record<CategoryTab, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All', icon: Star, color: Colors.secondary },
  wine: { label: 'Wines', icon: Wine, color: Colors.wineRed },
  beer: { label: 'Beers', icon: Beer, color: '#D4A84B' },
  spirit: { label: 'Spirits', icon: GlassWater, color: Colors.accent },
  cocktail: { label: 'Cocktails', icon: Martini, color: Colors.primary },
  'non-alcoholic': { label: 'Non-Alc', icon: Coffee, color: Colors.success },
};

export default function CustomerMenuScreen() {
  const router = useRouter();
  const { restaurant } = useRestaurant();
  const { wines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic } = useBeverages();
  
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    wine: true,
    beer: true,
    spirit: true,
    cocktail: true,
    'non-alcoholic': true,
  });

  const inStockWines = useMemo(() => wines.filter(w => w.inStock), [wines]);
  const inStockBeers = useMemo(() => beers.filter(b => b.inStock), [beers]);
  const inStockSpirits = useMemo(() => spirits.filter(s => s.inStock), [spirits]);
  const availableCocktails = useMemo(() => cocktails.filter(c => c.isAvailable), [cocktails]);
  const inStockNA = useMemo(() => nonAlcoholic.filter(n => n.inStock), [nonAlcoholic]);

  const featuredItems = useMemo(() => {
    const featured = [
      ...inStockWines.filter(w => w.featured).slice(0, 2),
      ...availableCocktails.filter(c => c.featured).slice(0, 2),
    ];
    return featured.slice(0, 4);
  }, [inStockWines, availableCocktails]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderCategoryTab = (category: CategoryTab) => {
    const config = categoryConfig[category];
    const isActive = activeCategory === category;
    
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => setActiveCategory(category)}
      >
        <config.icon size={16} color={isActive ? Colors.white : config.color} />
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWineItem = (wine: typeof inStockWines[0]) => (
    <View key={wine.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemMain}>
          <Text style={styles.menuItemName}>{wine.name}</Text>
          {wine.vintage && <Text style={styles.menuItemVintage}>{wine.vintage}</Text>}
        </View>
        <View style={styles.menuItemPrices}>
          {wine.glassPrice && (
            <Text style={styles.glassPrice}>Glass ${wine.glassPrice}</Text>
          )}
          <Text style={styles.bottlePrice}>${wine.price}</Text>
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
      {wine.featured && (
        <View style={styles.featuredBadge}>
          <Star size={10} color={Colors.secondary} fill={Colors.secondary} />
          <Text style={styles.featuredBadgeText}>Staff Pick</Text>
        </View>
      )}
    </View>
  );

  const renderBeerItem = (beer: typeof inStockBeers[0]) => (
    <View key={beer.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemMain}>
          <Text style={styles.menuItemName}>{beer.name}</Text>
          <Text style={styles.abvBadge}>{beer.abv}%</Text>
        </View>
        <Text style={styles.bottlePrice}>${beer.price}</Text>
      </View>
      <Text style={styles.menuItemProducer}>{beer.brewery}</Text>
      <Text style={styles.menuItemStyle}>{beer.style} • {beer.servingSize}</Text>
      {beer.description && (
        <Text style={styles.menuItemNotes} numberOfLines={2}>
          {beer.description}
        </Text>
      )}
    </View>
  );

  const renderSpiritItem = (spirit: typeof inStockSpirits[0]) => (
    <View key={spirit.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemMain}>
          <Text style={styles.menuItemName}>{spirit.name}</Text>
          {spirit.age && <Text style={styles.menuItemVintage}>{spirit.age}</Text>}
        </View>
        <View style={styles.menuItemPrices}>
          {spirit.shotPrice && (
            <Text style={styles.glassPrice}>Shot ${spirit.shotPrice}</Text>
          )}
          <Text style={styles.bottlePrice}>${spirit.price}</Text>
        </View>
      </View>
      <Text style={styles.menuItemProducer}>{spirit.brand}</Text>
      <Text style={styles.menuItemStyle}>{spirit.type} • {spirit.origin}</Text>
      {spirit.description && (
        <Text style={styles.menuItemNotes} numberOfLines={2}>
          {spirit.description}
        </Text>
      )}
    </View>
  );

  const renderCocktailItem = (cocktail: typeof availableCocktails[0]) => (
    <View key={cocktail.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemMain}>
          <Text style={styles.menuItemName}>{cocktail.name}</Text>
          {cocktail.isSignature && (
            <View style={styles.signatureBadge}>
              <Flame size={10} color={Colors.error} />
            </View>
          )}
        </View>
        <Text style={styles.bottlePrice}>${cocktail.price}</Text>
      </View>
      <Text style={styles.menuItemProducer}>{cocktail.baseSpirit}</Text>
      {cocktail.description && (
        <Text style={styles.menuItemNotes} numberOfLines={2}>
          {cocktail.description}
        </Text>
      )}
      <Text style={styles.ingredientsList}>
        {cocktail.ingredients.slice(0, 4).join(' • ')}
      </Text>
    </View>
  );

  const renderNonAlcoholicItem = (item: typeof inStockNA[0]) => (
    <View key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemMain}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <View style={styles.naIconBadge}>
            <Leaf size={10} color={Colors.success} />
          </View>
        </View>
        <Text style={styles.bottlePrice}>${item.price}</Text>
      </View>
      {item.brand && <Text style={styles.menuItemProducer}>{item.brand}</Text>}
      <Text style={styles.menuItemStyle}>{item.servingSize}</Text>
      {item.description && (
        <Text style={styles.menuItemNotes} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </View>
  );

  const renderSection = (
    category: BeverageCategory,
    title: string,
    items: any[],
    renderItem: (item: any) => React.ReactNode,
    icon: React.ElementType,
    color: string
  ) => {
    if (items.length === 0) return null;
    if (activeCategory !== 'all' && activeCategory !== category) return null;

    const Icon = icon;
    const isExpanded = expandedSections[category];

    return (
      <View key={category} style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection(category)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: color + '15' }]}>
              <Icon size={18} color={color} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.itemCount}>
              <Text style={styles.itemCountText}>{items.length}</Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={20} color={Colors.textMuted} />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {items.map(renderItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Preview</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {restaurant?.coverImageUrl && (
            <Image 
              source={{ uri: restaurant.coverImageUrl }} 
              style={styles.heroImage}
              contentFit="cover"
            />
          )}
          <View style={styles.heroOverlay}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            {restaurant?.cuisineType && (
              <Text style={styles.cuisineType}>{restaurant.cuisineType}</Text>
            )}
          </View>
        </View>

        <View style={styles.customerBanner}>
          <Text style={styles.customerBannerText}>
            This is how customers will see your menu
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {(Object.keys(categoryConfig) as CategoryTab[]).map(renderCategoryTab)}
        </ScrollView>

        {activeCategory === 'all' && featuredItems.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Star size={18} color={Colors.secondary} fill={Colors.secondary} />
              <Text style={styles.featuredTitle}>Staff Picks</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredItems.map((item, index) => (
                <View key={`featured-${index}`} style={styles.featuredCard}>
                  <View style={[
                    styles.featuredCardIcon, 
                    { backgroundColor: ('type' in item && wineTypeColors[item.type]) 
                      ? wineTypeColors[item.type] + '20' 
                      : Colors.primary + '20' 
                    }
                  ]}>
                    {'grape' in item ? (
                      <Wine size={24} color={wineTypeColors[item.type] || Colors.primary} />
                    ) : (
                      <Martini size={24} color={Colors.primary} />
                    )}
                  </View>
                  <Text style={styles.featuredCardName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.featuredCardPrice}>${item.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {renderSection('wine', 'Wines', inStockWines, renderWineItem, Wine, Colors.wineRed)}
        {renderSection('beer', 'Beers', inStockBeers, renderBeerItem, Beer, '#D4A84B')}
        {renderSection('spirit', 'Spirits & Liquors', inStockSpirits, renderSpiritItem, GlassWater, Colors.accent)}
        {renderSection('cocktail', 'Cocktails', availableCocktails, renderCocktailItem, Martini, Colors.primary)}
        {renderSection('non-alcoholic', 'Non-Alcoholic', inStockNA, renderNonAlcoholicItem, Coffee, Colors.success)}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Prices subject to change</Text>
          <Text style={styles.footerText}>Please inform your server of any allergies</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  hero: {
    height: 180,
    backgroundColor: Colors.primary,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  customerBanner: {
    backgroundColor: Colors.secondary + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  customerBannerText: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  categoryTabs: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  categoryTabTextActive: {
    color: Colors.white,
  },
  featuredSection: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 130,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredCardName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  featuredCardPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  itemCount: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuItem: {
    paddingVertical: 16,
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
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  menuItemVintage: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  abvBadge: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItemPrices: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  glassPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bottlePrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  menuItemProducer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  menuItemStyle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  menuItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
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
    lineHeight: 18,
    marginTop: 4,
  },
  ingredientsList: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  signatureBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  naIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 40,
  },
});
