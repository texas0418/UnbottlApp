import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SectionList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
import { fontFamily, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useIsDark } from '@/hooks/useTheme';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { useRecentMenus } from '@/contexts/RecentMenusContext';
import { fetchPublicMenu } from '@/services/publicMenu';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import { useResponsive } from '@/hooks/useResponsive';
import { BeverageCategory } from '@/types';

type CategoryTab = 'all' | BeverageCategory;

const categoryConfigFor = (c: ThemeColors): Record<CategoryTab, { label: string; icon: React.ElementType; color: string }> => ({
  all: { label: 'All', icon: Star, color: c.secondary },
  wine: { label: 'Wines', icon: Wine, color: c.wineRed },
  beer: { label: 'Beers', icon: Beer, color: c.warning },
  spirit: { label: 'Spirits', icon: GlassWater, color: c.accent },
  cocktail: { label: 'Cocktails', icon: Martini, color: c.primary },
  'non-alcoholic': { label: 'Non-Alc', icon: Coffee, color: c.success },
});

/** Accept only #RRGGBB so a bad stored value can't break the menu's styling. */
function safeBrandColor(value: string | null | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #2
export default function CustomerMenuScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categoryConfig = useMemo(() => categoryConfigFor(colors), [colors]);
  const { isTablet } = useResponsive();
  const params = useLocalSearchParams<{ r?: string }>();
  const scannedSlug = typeof params.r === 'string' && params.r.length > 0 ? params.r : undefined;

  const { restaurant: ctxRestaurant } = useRestaurant();
  const { wines: ctxWines } = useWines();
  const {
    beers: ctxBeers,
    spirits: ctxSpirits,
    cocktails: ctxCocktails,
    nonAlcoholic: ctxNonAlcoholic,
  } = useBeverages();
  const { recordView } = useRecentMenus();

  // When arriving from a scanned QR code (`?r=<slug>`), load that restaurant's
  // public menu. Otherwise fall back to the current restaurant in context
  // (owner preview from the QR generator).
  const publicMenuQuery = useQuery({
    queryKey: ['publicMenu', scannedSlug],
    queryFn: () => fetchPublicMenu(scannedSlug as string),
    enabled: !!scannedSlug,
  });
  const publicMenu = publicMenuQuery.data ?? null;

  useEffect(() => {
    if (publicMenu?.restaurant) {
      recordView({
        restaurantId: publicMenu.restaurant.id,
        name: publicMenu.restaurant.name,
        cuisineType: publicMenu.restaurant.cuisineType,
        imageUrl: publicMenu.restaurant.coverImageUrl ?? publicMenu.restaurant.logoUrl,
        itemCount: publicMenu.itemCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicMenu?.restaurant?.id]);

  const restaurant = scannedSlug ? publicMenu?.restaurant : ctxRestaurant;
  // The venue's accent drives the menu's styling; Unbottl's red is the fallback.
  const brandColor = safeBrandColor(restaurant?.brandColor, colors.primary);
  const wines = scannedSlug ? publicMenu?.wines ?? [] : ctxWines;
  const beers = scannedSlug ? publicMenu?.beers ?? [] : ctxBeers;
  const spirits = scannedSlug ? publicMenu?.spirits ?? [] : ctxSpirits;
  const cocktails = scannedSlug ? publicMenu?.cocktails ?? [] : ctxCocktails;
  const nonAlcoholic = scannedSlug ? publicMenu?.nonAlcoholic ?? [] : ctxNonAlcoholic;

  const isLoadingMenu = !!scannedSlug && publicMenuQuery.isLoading;
  const menuNotFound = !!scannedSlug && !publicMenuQuery.isLoading && !publicMenu;

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
        style={[
          styles.categoryTab,
          isActive && styles.categoryTabActive,
          isActive && { backgroundColor: brandColor, borderColor: brandColor },
        ]}
        onPress={() => setActiveCategory(category)}
      >
        <config.icon size={16} color={isActive ? colors.white : config.color} />
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
        <MapPin size={12} color={colors.textMuted} />
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
          <Star size={10} color={colors.secondary} fill={colors.secondary} />
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
              <Flame size={10} color={colors.error} />
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
            <Leaf size={10} color={colors.success} />
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

  // One entry per category. `data` is emptied when a section is collapsed so
  // the header stays put and SectionList mounts none of its rows; `count` is
  // captured beforehand so the badge still shows the true total.
  const sections = useMemo(() => {
    const all = [
      { key: 'wine' as const, title: 'Wines', icon: Wine, color: colors.wineRed, items: inStockWines },
      { key: 'beer' as const, title: 'Beers', icon: Beer, color: colors.warning, items: inStockBeers },
      { key: 'spirit' as const, title: 'Spirits & Liquors', icon: GlassWater, color: colors.accent, items: inStockSpirits },
      { key: 'cocktail' as const, title: 'Cocktails', icon: Martini, color: colors.primary, items: availableCocktails },
      { key: 'non-alcoholic' as const, title: 'Non-Alcoholic', icon: Coffee, color: colors.success, items: inStockNA },
    ];
    return all
      .filter((s) => s.items.length > 0)
      .filter((s) => activeCategory === 'all' || activeCategory === s.key)
      .map((s) => ({
        key: s.key,
        title: s.title,
        icon: s.icon,
        color: s.color,
        count: s.items.length,
        data: expandedSections[s.key] ? (s.items as any[]) : [],
      }));
  }, [
    colors, activeCategory, expandedSections,
    inStockWines, inStockBeers, inStockSpirits, availableCocktails, inStockNA,
  ]);

  const sectionRenderers: Record<string, (item: any) => React.ReactNode> = {
    wine: renderWineItem,
    beer: renderBeerItem,
    spirit: renderSpiritItem,
    cocktail: renderCocktailItem,
    'non-alcoholic': renderNonAlcoholicItem,
  };

  const renderSectionHeader = (section: (typeof sections)[number]) => {
    const Icon = section.icon;
    const isExpanded = expandedSections[section.key];

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityLabel={`${section.title}, ${section.count} items`}
        >
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: section.color + '15' }]}>
              <Icon size={18} color={section.color} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.itemCount}>
              <Text style={styles.itemCountText}>{section.count}</Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.textMuted} />
          ) : (
            <ChevronDown size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoadingMenu) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Menu</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading menu…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (menuNotFound) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.stateContainer}>
          <Text style={styles.stateEmoji}>🍷</Text>
          <Text style={styles.stateTitle}>Menu unavailable</Text>
          <Text style={styles.stateText}>
            We couldn&apos;t load this menu. It may be private or the code may be out of date.
          </Text>
          <TouchableOpacity style={styles.stateButton} onPress={() => router.back()}>
            <Text style={styles.stateButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{scannedSlug ? 'Menu' : 'Menu Preview'}</Text>
        <View style={styles.placeholder} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => <>{sectionRenderers[section.key](item)}</>}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isTablet ? styles.tabletContent : undefined}
        ListHeaderComponent={
        <>
        <View style={[styles.hero, { backgroundColor: brandColor }]}>
          {restaurant?.coverImageUrl && (
            <Image
              source={{ uri: restaurant.coverImageUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
          )}
          {/* Scrim only over photography — over a flat brand colour it would
              just muddy the venue's own hue. */}
          <View style={[styles.heroOverlay, restaurant?.coverImageUrl && styles.heroScrim]}>
            {restaurant?.logoUrl && (
              <Image
                source={{ uri: restaurant.logoUrl }}
                style={styles.heroLogo}
                contentFit="contain"
                accessibilityLabel={`${restaurant.name} logo`}
              />
            )}
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            {restaurant?.cuisineType && (
              <Text style={styles.cuisineType}>{restaurant.cuisineType}</Text>
            )}
          </View>
        </View>

        {!scannedSlug && (
          <View style={styles.customerBanner}>
            <Text style={styles.customerBannerText}>
              This is how customers will see your menu
            </Text>
          </View>
        )}

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
              <Star size={18} color={colors.secondary} fill={colors.secondary} />
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
                      : colors.primary + '20' 
                    }
                  ]}>
                    {'grape' in item ? (
                      <Wine size={24} color={wineTypeColors[item.type] || colors.primary} />
                    ) : (
                      <Martini size={24} color={colors.primary} />
                    )}
                  </View>
                  <Text style={styles.featuredCardName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.featuredCardPrice}>${item.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        </>
        }
        ListFooterComponent={
        <>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Prices subject to change</Text>
          <Text style={styles.footerText}>Please inform your server of any allergies</Text>
          {/* Unbottl signs the menu quietly — the page belongs to the venue. */}
          <Text style={styles.poweredBy}>Menu by Unbottl</Text>
        </View>

        <View style={styles.bottomPadding} />
        </>
        }
      />
    </SafeAreaView>
  );
}

// A style map rather than logic — splitting it to satisfy the line limit would
// scatter related styles for no readability gain. Length debt tracked in #20.
// eslint-disable-next-line max-lines-per-function
const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // On tablets, keep the menu a centered, readable column instead of stretching
  // edge-to-edge across the wide screen.
  tabletContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  stateEmoji: { fontSize: 44, marginBottom: 4 },
  stateTitle: { fontSize: 20, fontWeight: '700' as const, color: c.text },
  stateText: { fontSize: 15, color: c.textSecondary, textAlign: 'center', lineHeight: 22 },
  stateButton: {
    marginTop: 12,
    backgroundColor: c.primary,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  stateButtonText: { color: c.white, fontSize: 15, fontWeight: '600' as const },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
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
    color: c.text,
  },
  placeholder: {
    width: 40,
  },
  hero: {
    height: 180,
    backgroundColor: c.primary,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroScrim: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroLogo: {
    width: 92,
    height: 44,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  restaurantName: {
    fontSize: 30,
    fontFamily: fontFamily.displayBold,
    color: c.white,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  customerBanner: {
    backgroundColor: c.secondary + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.secondary + '30',
  },
  customerBannerText: {
    fontSize: 13,
    color: c.secondary,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: c.text,
  },
  categoryTabTextActive: {
    color: c.white,
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
    fontSize: 20,
    fontFamily: fontFamily.displaySemibold,
    color: c.text,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 130,
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: c.cardShadow,
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
    color: c.text,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  featuredCardPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: c.primary,
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
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.borderLight,
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
    fontSize: 20,
    fontFamily: fontFamily.displaySemibold,
    color: c.text,
  },
  itemCount: {
    backgroundColor: c.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
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
    fontSize: 17,
    fontFamily: fontFamily.displaySemibold,
    color: c.text,
  },
  menuItemVintage: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500' as const,
  },
  abvBadge: {
    fontSize: 11,
    color: c.textMuted,
    backgroundColor: c.borderLight,
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
    color: c.textSecondary,
    marginBottom: 2,
  },
  bottlePrice: {
    fontSize: 17,
    fontFamily: fontFamily.displaySemibold,
    color: c.primary,
  },
  menuItemProducer: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 4,
  },
  menuItemStyle: {
    fontSize: 13,
    color: c.textMuted,
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
    color: c.textMuted,
  },
  menuItemGrape: {
    fontSize: 13,
    color: c.textMuted,
  },
  menuItemNotes: {
    fontSize: 13,
    color: c.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  ingredientsList: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 6,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.secondary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: c.secondary,
  },
  signatureBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  naIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.success + '15',
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
    color: c.textMuted,
    fontStyle: 'italic',
  },
  poweredBy: {
    fontSize: 11,
    color: c.textMuted,
    letterSpacing: 0.6,
    marginTop: 10,
  },
  bottomPadding: {
    height: 40,
  },
});
