import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Wine, 
  Beer,
  GlassWater,
  Martini,
  Coffee,
  Star, 
  ArrowRight,
  Sparkles,
  Settings2,
  Zap,
  ScanLine,
  Heart,
  Compass,
  MessageCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import WineCard from '@/components/WineCard';
import BeverageCard from '@/components/BeverageCard';
import { useRecommendations } from '@/contexts/RecommendationsContext';
import PreferencesSetup from '@/components/PreferencesSetup';

export default function HomeScreen() {
  const router = useRouter();
  const { wines, featuredWines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic, featuredBeers, featuredSpirits, featuredCocktails } = useBeverages();
  const { restaurant } = useRestaurant();
  const { topPicks, recommendations, hasSetPreferences, learnedPreferences } = useRecommendations();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showPreferences, setShowPreferences] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const hasRecommendations = topPicks.length > 0 || learnedPreferences.preferredTypes.length > 0;

  const categoryStats = {
    wine: wines.length,
    beer: beers.length,
    spirit: spirits.length,
    cocktail: cocktails.length,
    nonAlcoholic: nonAlcoholic.length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome to</Text>
              <Text style={styles.title}>Unbottl</Text>
            </View>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => router.push('/menu-scanner')}
            >
              <ScanLine size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Discover your perfect drink</Text>
        </View>

        {/* AI Sommelier Banner */}
        <TouchableOpacity 
          style={styles.sommelierBanner}
          onPress={() => router.push('/sommelier-chat')}
          activeOpacity={0.9}
        >
          <View style={styles.sommelierGradient}>
            <View style={styles.sommelierContent}>
              <View style={styles.sommelierIconContainer}>
                <MessageCircle size={28} color={Colors.white} />
              </View>
              <View style={styles.sommelierTextContent}>
                <Text style={styles.sommelierTitle}>AI Sommelier</Text>
                <Text style={styles.sommelierSubtitle}>
                  Tell me what you're in the mood for
                </Text>
              </View>
            </View>
            <View style={styles.sommelierArrow}>
              <ArrowRight size={20} color={Colors.white} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/menu-scanner')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '15' }]}>
              <ScanLine size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Scan Menu</Text>
            <Text style={styles.quickActionDesc}>Scan a restaurant's QR code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/menu-import')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#6C5CE7' + '15' }]}>
            <Sparkles size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.quickActionTitle}>AI Import</Text>
            <Text style={styles.quickActionDesc}>Import menu with AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/catalog')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Compass size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.quickActionTitle}>Explore</Text>
            <Text style={styles.quickActionDesc}>Browse all beverages</Text>
          </TouchableOpacity>
        </View>

        {/* Personalized Recommendations */}
        <View style={styles.recommendationsSection}>
          <View style={styles.recommendationsHeader}>
            <View style={styles.recommendationsTitle}>
              <View style={styles.sparkleIcon}>
                <Sparkles size={18} color={Colors.secondary} />
              </View>
              <View>
                <Text style={styles.recommendationsTitleText}>For You</Text>
                <Text style={styles.recommendationsSubtitle}>
                  {hasSetPreferences 
                    ? 'Based on your preferences' 
                    : learnedPreferences.preferredTypes.length > 0
                      ? 'Based on your favorites'
                      : 'Personalized picks'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.preferencesButton}
              onPress={() => setShowPreferences(true)}
            >
              <Settings2 size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {hasRecommendations ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendationsList}
            >
              {topPicks.map((wine) => (
                <TouchableOpacity
                  key={wine.id}
                  style={styles.recommendationCard}
                  onPress={() => router.push(`/wine/${wine.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recommendationBadge}>
                    <Zap size={12} color={Colors.white} />
                    <Text style={styles.recommendationBadgeText}>{wine.matchScore}% match</Text>
                  </View>
                  <Image
                    source={{ uri: wine.imageUrl || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400' }}
                    style={styles.recommendationImage}
                    contentFit="cover"
                  />
                  <View style={styles.recommendationInfo}>
                    <Text style={styles.recommendationName} numberOfLines={1}>{wine.name}</Text>
                    <Text style={styles.recommendationProducer} numberOfLines={1}>{wine.producer}</Text>
                    <Text style={styles.recommendationPrice}>${wine.price}</Text>
                    {wine.matchReasons.length > 0 && (
                      <View style={styles.matchReasonContainer}>
                        <Text style={styles.matchReason} numberOfLines={1}>
                          {wine.matchReasons[0]}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {recommendations.length > 3 && (
                <TouchableOpacity
                  style={styles.seeMoreCard}
                  onPress={() => router.push('/(tabs)/catalog')}
                >
                  <Text style={styles.seeMoreText}>+{recommendations.length - 3}</Text>
                  <Text style={styles.seeMoreLabel}>more picks</Text>
                  <ArrowRight size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <TouchableOpacity 
              style={styles.setupPreferencesCard}
              onPress={() => setShowPreferences(true)}
            >
              <View style={styles.setupIcon}>
                <Sparkles size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.setupTitle}>Get personalized recommendations</Text>
              <Text style={styles.setupSubtitle}>
                Tell us your preferences and we'll suggest drinks you'll love
              </Text>
              <View style={styles.setupButton}>
                <Text style={styles.setupButtonText}>Set Preferences</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Compass size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Browse by Category</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            <TouchableOpacity 
              style={[styles.categoryCard, { borderLeftColor: '#722F37' }]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Wine size={24} color="#722F37" />
              <Text style={styles.categoryCardValue}>{categoryStats.wine}</Text>
              <Text style={styles.categoryCardLabel}>Wines</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { borderLeftColor: '#C67A3C' }]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Beer size={24} color="#C67A3C" />
              <Text style={styles.categoryCardValue}>{categoryStats.beer}</Text>
              <Text style={styles.categoryCardLabel}>Beers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { borderLeftColor: '#A0522D' }]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <GlassWater size={24} color="#A0522D" />
              <Text style={styles.categoryCardValue}>{categoryStats.spirit}</Text>
              <Text style={styles.categoryCardLabel}>Spirits</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { borderLeftColor: '#9B59B6' }]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Martini size={24} color="#9B59B6" />
              <Text style={styles.categoryCardValue}>{categoryStats.cocktail}</Text>
              <Text style={styles.categoryCardLabel}>Cocktails</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { borderLeftColor: '#3498DB' }]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Coffee size={24} color="#3498DB" />
              <Text style={styles.categoryCardValue}>{categoryStats.nonAlcoholic}</Text>
              <Text style={styles.categoryCardLabel}>Non-Alc</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {(featuredWines.length > 0 || featuredBeers.length > 0 || featuredSpirits.length > 0 || featuredCocktails.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Star size={18} color={Colors.secondary} fill={Colors.secondary} />
                <Text style={styles.sectionTitle}>Featured Selections</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/(tabs)/catalog')}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <ArrowRight size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredWines.slice(0, 3).map((wine) => (
                <View key={wine.id} style={styles.featuredCard}>
                  <WineCard
                    wine={wine}
                    onPress={() => router.push(`/wine/${wine.id}`)}
                  />
                </View>
              ))}
              {featuredBeers.slice(0, 2).map((beer) => (
                <View key={beer.id} style={styles.featuredCard}>
                  <BeverageCard
                    beverage={beer}
                    category="beer"
                    onPress={() => router.push(`/beverage/beer/${beer.id}`)}
                  />
                </View>
              ))}
              {featuredSpirits.slice(0, 2).map((spirit) => (
                <View key={spirit.id} style={styles.featuredCard}>
                  <BeverageCard
                    beverage={spirit}
                    category="spirit"
                    onPress={() => router.push(`/beverage/spirit/${spirit.id}`)}
                  />
                </View>
              ))}
              {featuredCocktails.slice(0, 2).map((cocktail) => (
                <View key={cocktail.id} style={styles.featuredCard}>
                  <BeverageCard
                    beverage={cocktail}
                    category="cocktail"
                    onPress={() => router.push(`/beverage/cocktail/${cocktail.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tasting Journal Prompt */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.journalPromptCard}
            onPress={() => router.push('/(tabs)/journal')}
          >
            <View style={styles.journalPromptContent}>
              <View style={styles.journalIcon}>
                <Heart size={24} color={Colors.primary} />
              </View>
              <View style={styles.journalTextContent}>
                <Text style={styles.journalPromptTitle}>Your Tasting Journal</Text>
                <Text style={styles.journalPromptDesc}>
                  Keep track of your favorite drinks and tasting notes
                </Text>
              </View>
            </View>
            <ArrowRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {restaurant?.coverImageUrl && (
          <View style={styles.restaurantBanner}>
            <Image 
              source={{ uri: restaurant.coverImageUrl }} 
              style={styles.bannerImage}
              contentFit="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{restaurant.name}</Text>
              <Text style={styles.bannerSubtitle}>{restaurant.cuisineType}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <PreferencesSetup
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sommelierBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  sommelierGradient: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sommelierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  sommelierIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sommelierTextContent: {
    flex: 1,
  },
  sommelierTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  sommelierSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  sommelierArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  quickActionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  categoryList: {
    gap: 10,
    paddingRight: 20,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
    borderLeftWidth: 3,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryCardValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  categoryCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  featuredList: {
    paddingRight: 20,
    gap: 16,
  },
  featuredCard: {
    width: 260,
  },
  journalPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '15',
  },
  journalPromptContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  journalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalTextContent: {
    flex: 1,
  },
  journalPromptTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  journalPromptDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  restaurantBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    height: 160,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  bottomPadding: {
    height: 30,
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationsTitleText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  recommendationsSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  preferencesButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationsList: {
    paddingRight: 20,
    gap: 14,
  },
  recommendationCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  recommendationBadge: {
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
  recommendationBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  recommendationImage: {
    width: '100%',
    height: 120,
  },
  recommendationInfo: {
    padding: 12,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  recommendationProducer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  recommendationPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  matchReasonContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchReason: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '500' as const,
  },
  seeMoreCard: {
    width: 100,
    backgroundColor: 'rgba(114, 47, 55, 0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  seeMoreText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  seeMoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  setupPreferencesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  setupIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  setupButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  setupButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
