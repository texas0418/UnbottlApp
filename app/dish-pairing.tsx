import React, { useState, useMemo, useRef } from 'react';
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
  ChevronRight,
  Beef,
  Fish,
  Salad,
  Cake,
  Utensils,
  Check,
  Sparkles,
  MapPin,
  Award,
  TrendingUp,
  Lightbulb,
  Droplets,
  Flame,
  CircleDot,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import { Wine as WineType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DishCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  dishes: string[];
  color: string;
}

interface FlavorInsight {
  attribute: string;
  level: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  pairingTip: string;
}

interface SmartSuggestion {
  reason: string;
  dishes: string[];
  attribute: string;
}

const getFlavorInsights = (profile: { body: number; sweetness: number; tannins: number; acidity: number }): FlavorInsight[] => {
  const insights: FlavorInsight[] = [];
  
  if (profile.body >= 4) {
    insights.push({
      attribute: 'Full-bodied',
      level: 'high',
      icon: Flame,
      color: '#DC2626',
      pairingTip: 'Rich meats & hearty dishes'
    });
  } else if (profile.body <= 2) {
    insights.push({
      attribute: 'Light-bodied',
      level: 'low',
      icon: Droplets,
      color: '#0EA5E9',
      pairingTip: 'Delicate seafood & light fare'
    });
  }
  
  if (profile.acidity >= 4) {
    insights.push({
      attribute: 'High acidity',
      level: 'high',
      icon: Zap,
      color: '#FBBF24',
      pairingTip: 'Fatty & creamy dishes'
    });
  }
  
  if (profile.tannins >= 4) {
    insights.push({
      attribute: 'High tannins',
      level: 'high',
      icon: CircleDot,
      color: '#7C3AED',
      pairingTip: 'Red meats & aged cheese'
    });
  }
  
  if (profile.sweetness >= 3) {
    insights.push({
      attribute: 'Off-dry',
      level: 'medium',
      icon: Cake,
      color: '#EC4899',
      pairingTip: 'Spicy foods & desserts'
    });
  }
  
  return insights;
};

const getSmartSuggestions = (profile: { body: number; sweetness: number; tannins: number; acidity: number }): SmartSuggestion[] => {
  const suggestions: SmartSuggestion[] = [];
  
  // Body-based suggestions
  if (profile.body >= 4) {
    suggestions.push({
      reason: 'Full body matches rich, hearty dishes',
      dishes: ['Beef tenderloin', 'Prime rib', 'Wagyu beef', 'Lamb rack', 'Game meats'],
      attribute: 'body'
    });
  } else if (profile.body <= 2) {
    suggestions.push({
      reason: 'Light body complements delicate flavors',
      dishes: ['Oysters', 'Grilled fish', 'Summer salads', 'Light pasta', 'Shrimp'],
      attribute: 'body'
    });
  } else {
    suggestions.push({
      reason: 'Medium body is versatile',
      dishes: ['Grilled chicken', 'Salmon', 'Mushroom risotto', 'Creamy pasta'],
      attribute: 'body'
    });
  }
  
  // Acidity-based suggestions
  if (profile.acidity >= 4) {
    suggestions.push({
      reason: 'High acidity cuts through richness',
      dishes: ['Creamy pasta', 'Lobster', 'Cheese board', 'Fried foods', 'Goat cheese salad'],
      attribute: 'acidity'
    });
  }
  
  // Tannin-based suggestions
  if (profile.tannins >= 4) {
    suggestions.push({
      reason: 'Bold tannins tame protein & fat',
      dishes: ['Steak', 'Aged cheeses', 'Venison', 'Beef tartare', 'Strong cheeses'],
      attribute: 'tannins'
    });
  } else if (profile.tannins <= 2) {
    suggestions.push({
      reason: 'Soft tannins suit lighter proteins',
      dishes: ['Seafood platter', 'Vegetable tart', 'Soft cheeses', 'Grilled vegetables'],
      attribute: 'tannins'
    });
  }
  
  // Sweetness-based suggestions
  if (profile.sweetness >= 3) {
    suggestions.push({
      reason: 'Sweetness balances heat & spice',
      dishes: ['Spicy cuisine', 'Fruit desserts', 'Blue cheese', 'Asian dishes'],
      attribute: 'sweetness'
    });
  }
  
  return suggestions;
};

const calculateFlavorMatch = (
  wineProfile: { body: number; sweetness: number; tannins: number; acidity: number },
  dishCategory: string
): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  
  const categoryProfiles: Record<string, { idealBody: [number, number]; idealAcidity: [number, number]; idealTannins: [number, number]; idealSweetness: [number, number] }> = {
    'red-meat': { idealBody: [4, 5], idealAcidity: [2, 4], idealTannins: [3, 5], idealSweetness: [1, 2] },
    'seafood': { idealBody: [1, 3], idealAcidity: [3, 5], idealTannins: [1, 2], idealSweetness: [1, 3] },
    'vegetarian': { idealBody: [2, 4], idealAcidity: [3, 4], idealTannins: [1, 3], idealSweetness: [1, 3] },
    'pasta-rice': { idealBody: [2, 4], idealAcidity: [3, 5], idealTannins: [1, 4], idealSweetness: [1, 2] },
    'cheese': { idealBody: [3, 5], idealAcidity: [2, 4], idealTannins: [2, 5], idealSweetness: [1, 4] },
    'dessert': { idealBody: [2, 4], idealAcidity: [2, 4], idealTannins: [1, 2], idealSweetness: [3, 5] },
  };
  
  const profile = categoryProfiles[dishCategory];
  if (!profile) return { score: 50, reasons: [] };
  
  // Check body match
  if (wineProfile.body >= profile.idealBody[0] && wineProfile.body <= profile.idealBody[1]) {
    score += 25;
    if (wineProfile.body >= 4) reasons.push('Full body matches dish intensity');
    else if (wineProfile.body <= 2) reasons.push('Light body complements delicate flavors');
    else reasons.push('Balanced body works well');
  }
  
  // Check acidity match
  if (wineProfile.acidity >= profile.idealAcidity[0] && wineProfile.acidity <= profile.idealAcidity[1]) {
    score += 25;
    if (wineProfile.acidity >= 4) reasons.push('High acidity cuts through richness');
  }
  
  // Check tannins match
  if (wineProfile.tannins >= profile.idealTannins[0] && wineProfile.tannins <= profile.idealTannins[1]) {
    score += 25;
    if (wineProfile.tannins >= 4) reasons.push('Bold tannins complement proteins');
    else if (wineProfile.tannins <= 2) reasons.push('Soft tannins won\'t overpower');
  }
  
  // Check sweetness match
  if (wineProfile.sweetness >= profile.idealSweetness[0] && wineProfile.sweetness <= profile.idealSweetness[1]) {
    score += 25;
    if (wineProfile.sweetness >= 3) reasons.push('Sweetness balances the dish');
  }
  
  return { score, reasons };
};

const defaultFlavorProfile = { body: 3, sweetness: 2, tannins: 3, acidity: 3 };

const dishCategories: DishCategory[] = [
  {
    id: 'red-meat',
    name: 'Red Meat',
    icon: Beef,
    color: '#8B4513',
    dishes: [
      'Beef tenderloin',
      'Prime rib',
      'Lamb rack',
      'Wagyu beef',
      'Steak',
      'Beef tartare',
      'Game meats',
      'Venison',
    ],
  },
  {
    id: 'seafood',
    name: 'Seafood',
    icon: Fish,
    color: '#2E86AB',
    dishes: [
      'Oysters',
      'Lobster',
      'Grilled fish',
      'Seafood platter',
      'Salmon',
      'Shrimp',
      'Caviar',
      'Crab',
      'Scallops',
    ],
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    icon: Salad,
    color: '#4A7C59',
    dishes: [
      'Summer salads',
      'Goat cheese salad',
      'Mushroom risotto',
      'Vegetable tart',
      'Grilled vegetables',
      'Truffle dishes',
    ],
  },
  {
    id: 'pasta-rice',
    name: 'Pasta & Rice',
    icon: Utensils,
    color: '#D4A574',
    dishes: [
      'Light pasta',
      'Creamy pasta',
      'Tomato-based pasta',
      'Risotto',
      'Paella',
    ],
  },
  {
    id: 'cheese',
    name: 'Cheese',
    icon: Cake,
    color: '#F5B041',
    dishes: [
      'Aged cheeses',
      'Strong cheeses',
      'Soft cheeses',
      'Blue cheese',
      'Cheese board',
    ],
  },
  {
    id: 'dessert',
    name: 'Dessert',
    icon: Cake,
    color: '#E8B4B8',
    dishes: [
      'Dark chocolate',
      'Fruit desserts',
      'Crème brûlée',
      'Tiramisu',
      'Celebration moments',
    ],
  },
];

export default function DishPairingScreen() {
  const router = useRouter();
  const { inStockWines } = useWines();
  const { restaurant } = useRestaurant();
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const toggleDish = (dish: string) => {
    setSelectedDishes(prev => 
      prev.includes(dish) 
        ? prev.filter(d => d !== dish)
        : [...prev, dish]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const selectedCategories = useMemo(() => {
    const categories: string[] = [];
    selectedDishes.forEach(dish => {
      dishCategories.forEach(cat => {
        if (cat.dishes.includes(dish) && !categories.includes(cat.id)) {
          categories.push(cat.id);
        }
      });
    });
    return categories;
  }, [selectedDishes]);

  const recommendedWines = useMemo(() => {
    if (selectedDishes.length === 0) return [];

    const scoredWines = inStockWines.map(wine => {
      const flavorProfile = wine.flavorProfile || defaultFlavorProfile;
      let rawScore = 0;
      const matchedPairings: string[] = [];
      let exactMatches = 0;
      let partialMatches = 0;
      const flavorReasons: string[] = [];
      let flavorBonus = 0;

      selectedDishes.forEach(dish => {
        const dishLower = dish.toLowerCase();
        const dishWords = dishLower.split(' ').filter(w => w.length > 2);
        
        wine.foodPairings.forEach(pairing => {
          const pairingLower = pairing.toLowerCase();
          
          // Exact match (highest score)
          if (pairingLower === dishLower || pairingLower.includes(dishLower) || dishLower.includes(pairingLower)) {
            rawScore += 30;
            exactMatches++;
            if (!matchedPairings.includes(pairing)) {
              matchedPairings.push(pairing);
            }
          }
          // Partial word match
          else if (
            dishWords.some(word => pairingLower.includes(word)) ||
            pairingLower.split(' ').some(word => word.length > 2 && dishLower.includes(word))
          ) {
            rawScore += 15;
            partialMatches++;
            if (!matchedPairings.includes(pairing)) {
              matchedPairings.push(pairing);
            }
          }
        });
      });

      // Smart flavor profile matching
      selectedCategories.forEach(categoryId => {
        const match = calculateFlavorMatch(flavorProfile, categoryId);
        flavorBonus += match.score * 0.3; // Weight flavor matching
        match.reasons.forEach(r => {
          if (!flavorReasons.includes(r)) flavorReasons.push(r);
        });
      });

      // Calculate confidence score (0-100)
      const maxPossibleScore = selectedDishes.length * 30;
      const baseConfidence = Math.min((rawScore / maxPossibleScore) * 100, 100);
      
      // Bonus for matching multiple dishes
      const multiMatchBonus = matchedPairings.length > 1 ? Math.min(matchedPairings.length * 5, 15) : 0;
      
      // Include flavor profile bonus
      const totalConfidence = baseConfidence + multiMatchBonus + (flavorBonus / selectedCategories.length || 0);
      const confidenceScore = Math.min(Math.round(totalConfidence), 100);

      // Get smart suggestions for this wine
      const smartSuggestions = getSmartSuggestions(flavorProfile);
      const flavorInsights = getFlavorInsights(flavorProfile);

      return { 
        wine, 
        score: rawScore, 
        matchedPairings, 
        confidenceScore, 
        exactMatches, 
        partialMatches,
        flavorReasons,
        smartSuggestions,
        flavorInsights
      };
    });

    // Include wines with good flavor match even without direct pairing match
    const directMatches = scoredWines.filter(item => item.score > 0);
    const flavorMatches = scoredWines
      .filter(item => item.score === 0 && item.flavorReasons.length > 0)
      .map(item => ({ ...item, confidenceScore: Math.min(item.flavorReasons.length * 20, 60) }));

    return [...directMatches, ...flavorMatches]
      .sort((a, b) => b.confidenceScore - a.confidenceScore || b.score - a.score)
      .slice(0, 8);
  }, [selectedDishes, selectedCategories, inStockWines]);

  const handleFindPairings = () => {
    setShowResults(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleBackToSelection = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowResults(false);
    });
  };

  const getConfidenceLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 85) return { label: 'Excellent Match', color: '#059669', bgColor: '#D1FAE5' };
    if (score >= 70) return { label: 'Great Match', color: '#0891B2', bgColor: '#CFFAFE' };
    if (score >= 50) return { label: 'Good Match', color: '#D97706', bgColor: '#FEF3C7' };
    return { label: 'Fair Match', color: '#9CA3AF', bgColor: '#F3F4F6' };
  };

  const renderWineCard = (item: { wine: WineType; score: number; matchedPairings: string[]; confidenceScore: number; exactMatches: number; partialMatches: number; flavorReasons: string[]; smartSuggestions: SmartSuggestion[]; flavorInsights: FlavorInsight[] }, index: number) => {
    const { wine, matchedPairings, confidenceScore, flavorReasons, flavorInsights } = item;
    const confidenceLevel = getConfidenceLevel(confidenceScore);
    const isTopPick = index === 0 && confidenceScore >= 70;
    const isFlavorMatch = item.score === 0 && flavorReasons.length > 0;
    
    return (
      <View key={wine.id} style={[styles.wineCard, isTopPick && styles.topPickCard]}>
        {isTopPick && (
          <View style={styles.topPickBanner}>
            <Award size={14} color="#F59E0B" />
            <Text style={styles.topPickText}>Top Pick</Text>
          </View>
        )}
        
        {/* Confidence Score Section */}
        <View style={styles.confidenceSection}>
          <View style={styles.confidenceHeader}>
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceLevel.bgColor }]}>
              <TrendingUp size={12} color={confidenceLevel.color} />
              <Text style={[styles.confidenceLabel, { color: confidenceLevel.color }]}>
                {confidenceLevel.label}
              </Text>
            </View>
            <Text style={[styles.confidencePercent, { color: confidenceLevel.color }]}>
              {confidenceScore}%
            </Text>
          </View>
          <View style={styles.confidenceBarContainer}>
            <View style={styles.confidenceBarBg}>
              <View 
                style={[
                  styles.confidenceBarFill, 
                  { width: `${confidenceScore}%`, backgroundColor: confidenceLevel.color }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.wineCardHeader}>
          <View style={[styles.wineImageContainer, { backgroundColor: wineTypeColors[wine.type] + '20' }]}>
            {wine.imageUrl ? (
              <Image source={{ uri: wine.imageUrl }} style={styles.wineImage} contentFit="cover" />
            ) : (
              <Wine size={28} color={wineTypeColors[wine.type]} />
            )}
          </View>
          <View style={styles.wineInfo}>
            <View style={styles.wineTypeRow}>
              <View style={[styles.wineTypeBadge, { backgroundColor: wineTypeColors[wine.type] + '20' }]}>
                <Text style={[styles.wineTypeText, { color: wineTypeColors[wine.type] }]}>
                  {wineTypeLabels[wine.type]}
                </Text>
              </View>
            </View>
            <Text style={styles.wineName} numberOfLines={2}>{wine.name}</Text>
            <Text style={styles.wineProducer}>{wine.producer}</Text>
            <View style={styles.wineLocation}>
              <MapPin size={12} color={Colors.textMuted} />
              <Text style={styles.wineRegion}>{wine.region}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            {wine.glassPrice && (
              <Text style={styles.glassPrice}>${wine.glassPrice}/glass</Text>
            )}
            <Text style={styles.bottlePrice}>${wine.price}</Text>
          </View>
        </View>
        
        {matchedPairings.length > 0 && (
          <View style={styles.matchSection}>
            <View style={styles.matchHeader}>
              <Sparkles size={14} color={Colors.secondary} />
              <Text style={styles.matchLabel}>Pairs well with:</Text>
            </View>
            <Text style={styles.matchText}>{matchedPairings.join(', ')}</Text>
          </View>
        )}

        {/* Smart Flavor Insights */}
        {flavorInsights.length > 0 && (
          <View style={styles.flavorInsightsSection}>
            <View style={styles.insightsHeader}>
              <Lightbulb size={14} color="#F59E0B" />
              <Text style={styles.insightsLabel}>Flavor Profile</Text>
            </View>
            <View style={styles.insightsGrid}>
              {flavorInsights.slice(0, 3).map((insight, idx) => {
                const InsightIcon = insight.icon;
                return (
                  <View key={idx} style={[styles.insightChip, { backgroundColor: insight.color + '15' }]}>
                    <InsightIcon size={12} color={insight.color} />
                    <Text style={[styles.insightText, { color: insight.color }]}>
                      {insight.attribute}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Flavor-based reasoning */}
        {flavorReasons.length > 0 && (
          <View style={styles.flavorReasonSection}>
            <View style={styles.reasonHeader}>
              <Lightbulb size={12} color={isFlavorMatch ? '#10B981' : Colors.textSecondary} />
              <Text style={[styles.reasonTitle, isFlavorMatch && styles.flavorMatchTitle]}>
                {isFlavorMatch ? 'Why this works:' : 'Smart pairing:'}
              </Text>
            </View>
            <View style={styles.reasonsList}>
              {flavorReasons.slice(0, 2).map((reason, idx) => (
                <Text key={idx} style={styles.reasonText}>• {reason}</Text>
              ))}
            </View>
          </View>
        )}

        {wine.tastingNotes && (
          <Text style={styles.tastingNotes} numberOfLines={2}>
            {wine.tastingNotes}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={showResults ? handleBackToSelection : () => router.back()}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pair With My Dish</Text>
          <Text style={styles.headerSubtitle}>{restaurant?.name}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {!showResults ? (
        <>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.introSection}>
              <View style={styles.introIcon}>
                <Wine size={32} color={Colors.primary} />
              </View>
              <Text style={styles.introTitle}>What are you having?</Text>
              <Text style={styles.introText}>
                Select your dishes and we&apos;ll recommend the perfect wines to complement your meal.
              </Text>
            </View>

            {selectedDishes.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedLabel}>Your selections ({selectedDishes.length})</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedList}
                >
                  {selectedDishes.map(dish => (
                    <TouchableOpacity 
                      key={dish} 
                      style={styles.selectedChip}
                      onPress={() => toggleDish(dish)}
                    >
                      <Text style={styles.selectedChipText}>{dish}</Text>
                      <X size={14} color={Colors.white} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.categoriesSection}>
              {dishCategories.map(category => {
                const CategoryIcon = category.icon;
                const isExpanded = expandedCategory === category.id;
                const selectedCount = category.dishes.filter(d => selectedDishes.includes(d)).length;

                return (
                  <View key={category.id} style={styles.categoryContainer}>
                    <TouchableOpacity 
                      style={styles.categoryHeader}
                      onPress={() => toggleCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                        <CategoryIcon size={22} color={category.color} />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      {selectedCount > 0 && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{selectedCount}</Text>
                        </View>
                      )}
                      <ChevronRight 
                        size={20} 
                        color={Colors.textMuted} 
                        style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.dishesGrid}>
                        {category.dishes.map(dish => {
                          const isSelected = selectedDishes.includes(dish);
                          return (
                            <TouchableOpacity
                              key={dish}
                              style={[
                                styles.dishChip,
                                isSelected && { backgroundColor: category.color, borderColor: category.color },
                              ]}
                              onPress={() => toggleDish(dish)}
                              activeOpacity={0.7}
                            >
                              {isSelected && (
                                <Check size={14} color={Colors.white} style={styles.checkIcon} />
                              )}
                              <Text style={[
                                styles.dishChipText,
                                isSelected && styles.dishChipTextSelected,
                              ]}>
                                {dish}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {selectedDishes.length > 0 && (
            <View style={styles.bottomAction}>
              <TouchableOpacity 
                style={styles.findButton}
                onPress={handleFindPairings}
                activeOpacity={0.8}
              >
                <Sparkles size={20} color={Colors.white} />
                <Text style={styles.findButtonText}>
                  Find Wine Pairings ({selectedDishes.length} {selectedDishes.length === 1 ? 'dish' : 'dishes'})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <Animated.View 
          style={[
            styles.resultsContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsContent}
          >
            <View style={styles.resultsHeader}>
              <Sparkles size={24} color={Colors.secondary} />
              <Text style={styles.resultsTitle}>
                {recommendedWines.length > 0 
                  ? `${recommendedWines.length} Perfect ${recommendedWines.length === 1 ? 'Pairing' : 'Pairings'}`
                  : 'No Exact Matches'
                }
              </Text>
              <Text style={styles.resultsSubtitle}>
                {recommendedWines.length > 0 
                  ? `Based on your selection of ${selectedDishes.length} ${selectedDishes.length === 1 ? 'dish' : 'dishes'}`
                  : 'Try selecting different dishes or ask your sommelier'
                }
              </Text>
            </View>

            <View style={styles.selectedDishesResult}>
              <Text style={styles.selectedDishesLabel}>Your dishes:</Text>
              <View style={styles.selectedDishesRow}>
                {selectedDishes.map(dish => (
                  <View key={dish} style={styles.selectedDishTag}>
                    <Text style={styles.selectedDishTagText}>{dish}</Text>
                  </View>
                ))}
              </View>
            </View>

            {recommendedWines.length > 0 ? (
              <View style={styles.winesList}>
                {recommendedWines.map((item, index) => renderWineCard(item, index))}
              </View>
            ) : (
              <View style={styles.emptyResults}>
                <Wine size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  Our sommelier would love to help you find the perfect pairing.
                </Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={styles.bottomAction}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToSelection}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Modify Selection</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    backgroundColor: Colors.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
  },
  introIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  selectedLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedList: {
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.white,
  },
  categoriesSection: {
    paddingHorizontal: 20,
  },
  categoryContainer: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  dishChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  checkIcon: {
    marginRight: 6,
  },
  dishChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  dishChipTextSelected: {
    color: Colors.white,
    fontWeight: '500' as const,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  findButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  bottomPadding: {
    height: 120,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 100,
  },
  resultsHeader: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 20,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectedDishesResult: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectedDishesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDishesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedDishTag: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectedDishTagText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.secondary,
  },
  winesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  wineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  topPickCard: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  topPickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  topPickText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceSection: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  confidencePercent: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  confidenceBarContainer: {
    width: '100%',
  },
  confidenceBarBg: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wineCardHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  wineImageContainer: {
    width: 70,
    height: 90,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  wineImage: {
    width: '100%',
    height: '100%',
  },
  wineInfo: {
    flex: 1,
  },
  wineTypeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  wineTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wineTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  wineName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  wineProducer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  wineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wineRegion: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  glassPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bottlePrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  matchSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  matchText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  tastingNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 10,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  flavorInsightsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  insightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  insightText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  flavorReasonSection: {
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  flavorMatchTitle: {
    color: '#10B981',
  },
  reasonsList: {
    gap: 2,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
