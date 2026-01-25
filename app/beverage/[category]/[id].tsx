import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { 
  ArrowLeft, Edit2, Trash2, Star, MapPin, Droplets,
  Wine, Beer, GlassWater, Martini, Coffee, Percent, Clock, Package, Bookmark
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBeverages } from '@/contexts/BeverageContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { BeverageCategory } from '@/types';
import { 
  beerTypeColors, beerTypeLabels,
  spiritTypeColors, spiritTypeLabels,
  cocktailTypeColors, cocktailTypeLabels,
  nonAlcoholicTypeColors, nonAlcoholicTypeLabels,
  categoryColors,
} from '@/mocks/beverages';
import Button from '@/components/Button';

const getCategoryIcon = (category: BeverageCategory, size: number, color: string) => {
  switch (category) {
    case 'beer': return <Beer size={size} color={color} />;
    case 'spirit': return <GlassWater size={size} color={color} />;
    case 'cocktail': return <Martini size={size} color={color} />;
    case 'non-alcoholic': return <Coffee size={size} color={color} />;
    default: return <Wine size={size} color={color} />;
  }
};

export default function BeverageDetailScreen() {
  const router = useRouter();
  const { category, id } = useLocalSearchParams<{ category: string; id: string }>();
  const { 
    getBeerById, getSpiritById, getCocktailById, getNonAlcoholicById,
    deleteBeer, deleteSpirit, deleteCocktail, deleteNonAlcoholic,
    updateBeer, updateSpirit, updateCocktail, updateNonAlcoholic,
  } = useBeverages();
  const { isInWishlist, addToWishlist, removeByBeverageId, isAdding } = useWishlist();
  const { restaurant } = useRestaurant();

  const beverageCategory = category as BeverageCategory;
  
  const getBeverage = () => {
    switch (beverageCategory) {
      case 'beer': return getBeerById(id);
      case 'spirit': return getSpiritById(id);
      case 'cocktail': return getCocktailById(id);
      case 'non-alcoholic': return getNonAlcoholicById(id);
      default: return null;
    }
  };

  const beverage = getBeverage();
  const isWishlisted = beverage ? isInWishlist(beverage.id) : false;

  if (!beverage) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Beverage not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const getTypeColor = () => {
    switch (beverageCategory) {
      case 'beer': return beerTypeColors[(beverage as any).type] || categoryColors.beer;
      case 'spirit': return spiritTypeColors[(beverage as any).type] || categoryColors.spirit;
      case 'cocktail': return cocktailTypeColors[(beverage as any).type] || categoryColors.cocktail;
      case 'non-alcoholic': return nonAlcoholicTypeColors[(beverage as any).type] || categoryColors['non-alcoholic'];
      default: return Colors.primary;
    }
  };

  const getTypeLabel = () => {
    switch (beverageCategory) {
      case 'beer': return beerTypeLabels[(beverage as any).type] || (beverage as any).type;
      case 'spirit': return spiritTypeLabels[(beverage as any).type] || (beverage as any).type;
      case 'cocktail': return cocktailTypeLabels[(beverage as any).type] || (beverage as any).type;
      case 'non-alcoholic': return nonAlcoholicTypeLabels[(beverage as any).type] || (beverage as any).type;
      default: return '';
    }
  };

  const typeColor = getTypeColor();
  const isLightType = ['vodka', 'wheat', 'pilsner', 'water'].includes((beverage as any).type);

  const handleDelete = () => {
    Alert.alert(
      'Delete Beverage',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              switch (beverageCategory) {
                case 'beer': await deleteBeer(id); break;
                case 'spirit': await deleteSpirit(id); break;
                case 'cocktail': await deleteCocktail(id); break;
                case 'non-alcoholic': await deleteNonAlcoholic(id); break;
              }
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete beverage');
            }
          },
        },
      ]
    );
  };

  const handleToggleStock = async () => {
    try {
      switch (beverageCategory) {
        case 'beer':
          await updateBeer({ id, updates: { inStock: !(beverage as any).inStock } });
          break;
        case 'spirit':
          await updateSpirit({ id, updates: { inStock: !(beverage as any).inStock } });
          break;
        case 'cocktail':
          await updateCocktail({ id, updates: { isAvailable: !(beverage as any).isAvailable } });
          break;
        case 'non-alcoholic':
          await updateNonAlcoholic({ id, updates: { inStock: !(beverage as any).inStock } });
          break;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock status');
    }
  };

  const handleToggleFeatured = async () => {
    try {
      switch (beverageCategory) {
        case 'beer':
          await updateBeer({ id, updates: { featured: !(beverage as any).featured } });
          break;
        case 'spirit':
          await updateSpirit({ id, updates: { featured: !(beverage as any).featured } });
          break;
        case 'cocktail':
          await updateCocktail({ id, updates: { featured: !(beverage as any).featured } });
          break;
        case 'non-alcoholic':
          await updateNonAlcoholic({ id, updates: { featured: !(beverage as any).featured } });
          break;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update featured status');
    }
  };

  const isInStock = beverageCategory === 'cocktail' ? (beverage as any).isAvailable : (beverage as any).inStock;

  const handleToggleWishlist = async () => {
    if (!beverage) return;
    
    const getProducer = () => {
      switch (beverageCategory) {
        case 'beer': return (beverage as any).brewery;
        case 'spirit': return (beverage as any).brand;
        case 'cocktail': return (beverage as any).baseSpirit;
        case 'non-alcoholic': return (beverage as any).brand || 'House Made';
        default: return '';
      }
    };
    
    if (isWishlisted) {
      await removeByBeverageId(beverage.id);
    } else {
      await addToWishlist({
        beverageId: beverage.id,
        beverageName: beverage.name,
        beverageCategory: beverageCategory,
        beverageType: (beverage as any).type || '',
        producer: getProducer(),
        price: (beverage as any).price,
        restaurantName: restaurant?.name || 'Unknown Restaurant',
        notes: '',
      });
    }
  };

  const renderBeerDetails = () => {
    const beer = beverage as any;
    return (
      <>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Percent size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{beer.abv}%</Text>
            <Text style={styles.statLabel}>ABV</Text>
          </View>
          {beer.ibu && (
            <View style={styles.statItem}>
              <Package size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{beer.ibu}</Text>
              <Text style={styles.statLabel}>IBU</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Droplets size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{beer.quantity}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
        </View>
        {beer.style && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Style</Text>
            <Text style={styles.infoValue}>{beer.style}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Serving Size</Text>
          <Text style={styles.infoValue}>{beer.servingSize}</Text>
        </View>
        {beer.foodPairings?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Pairings</Text>
            <View style={styles.tagsContainer}>
              {beer.foodPairings.map((pairing: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{pairing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  const renderSpiritDetails = () => {
    const spirit = beverage as any;
    return (
      <>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Percent size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{spirit.abv}%</Text>
            <Text style={styles.statLabel}>ABV</Text>
          </View>
          {spirit.age && (
            <View style={styles.statItem}>
              <Clock size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{spirit.age}</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Droplets size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{spirit.quantity}</Text>
            <Text style={styles.statLabel}>Bottles</Text>
          </View>
        </View>
        {spirit.shotPrice && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shot Price</Text>
            <Text style={styles.infoValue}>${spirit.shotPrice}</Text>
          </View>
        )}
        {spirit.mixers?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Mixers</Text>
            <View style={styles.tagsContainer}>
              {spirit.mixers.map((mixer: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{mixer}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  const renderCocktailDetails = () => {
    const cocktail = beverage as any;
    return (
      <>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Base Spirit</Text>
          <Text style={styles.infoValue}>{cocktail.baseSpirit}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Glass Type</Text>
          <Text style={styles.infoValue}>{cocktail.glassType}</Text>
        </View>
        {cocktail.garnish && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Garnish</Text>
            <Text style={styles.infoValue}>{cocktail.garnish}</Text>
          </View>
        )}
        {cocktail.ingredients?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.tagsContainer}>
              {cocktail.ingredients.map((ingredient: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  const renderNonAlcoholicDetails = () => {
    const na = beverage as any;
    return (
      <>
        <View style={styles.statsRow}>
          {na.calories !== null && (
            <View style={styles.statItem}>
              <Package size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{na.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Droplets size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{na.quantity}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Serving Size</Text>
          <Text style={styles.infoValue}>{na.servingSize}</Text>
        </View>
        {na.ingredients?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.tagsContainer}>
              {na.ingredients.map((ingredient: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  const renderCategoryDetails = () => {
    switch (beverageCategory) {
      case 'beer': return renderBeerDetails();
      case 'spirit': return renderSpiritDetails();
      case 'cocktail': return renderCocktailDetails();
      case 'non-alcoholic': return renderNonAlcoholicDetails();
      default: return null;
    }
  };

  const getSubtitle = () => {
    switch (beverageCategory) {
      case 'beer': return (beverage as any).brewery;
      case 'spirit': return (beverage as any).brand;
      case 'cocktail': return (beverage as any).baseSpirit;
      case 'non-alcoholic': return (beverage as any).brand || 'House Made';
      default: return '';
    }
  };

  const getOrigin = () => {
    switch (beverageCategory) {
      case 'beer': return (beverage as any).origin;
      case 'spirit': return (beverage as any).origin;
      default: return null;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={handleToggleWishlist} 
                style={styles.headerButton}
                disabled={isAdding}
              >
                <Bookmark 
                  size={22} 
                  color={Colors.white} 
                  fill={isWishlisted ? Colors.white : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Trash2 size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: typeColor + '30' }]}>
          {(beverage as any).imageUrl ? (
            <Image source={{ uri: (beverage as any).imageUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              {getCategoryIcon(beverageCategory, 80, typeColor)}
            </View>
          )}
          <View style={styles.heroOverlay} />
          {(beverage as any).featured && (
            <View style={styles.featuredBadge}>
              <Star size={14} color={Colors.secondary} fill={Colors.secondary} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={[styles.typeBadgeText, isLightType && styles.darkText]}>
                {getTypeLabel()}
              </Text>
            </View>
            <Text style={styles.title}>{beverage.name}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
            {getOrigin() && (
              <View style={styles.originRow}>
                <MapPin size={14} color={Colors.textMuted} />
                <Text style={styles.originText}>{getOrigin()}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>${(beverage as any).price}</Text>
            <View style={[styles.stockBadge, !isInStock && styles.outOfStockBadge]}>
              <Droplets size={14} color={isInStock ? Colors.success : Colors.error} />
              <Text style={[styles.stockText, !isInStock && styles.outOfStockText]}>
                {isInStock ? (beverageCategory === 'cocktail' ? 'Available' : 'In Stock') : (beverageCategory === 'cocktail' ? 'Unavailable' : 'Out of Stock')}
              </Text>
            </View>
          </View>

          {(beverage as any).description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{(beverage as any).description}</Text>
            </View>
          )}

          {renderCategoryDetails()}

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, isInStock && styles.actionButtonActive]}
              onPress={handleToggleStock}
            >
              <Droplets size={20} color={isInStock ? Colors.white : Colors.primary} />
              <Text style={[styles.actionButtonText, isInStock && styles.actionButtonTextActive]}>
                {isInStock ? 'Mark Out of Stock' : 'Mark In Stock'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, (beverage as any).featured && styles.actionButtonActive]}
              onPress={handleToggleFeatured}
            >
              <Star size={20} color={(beverage as any).featured ? Colors.white : Colors.primary} fill={(beverage as any).featured ? Colors.white : 'none'} />
              <Text style={[styles.actionButtonText, (beverage as any).featured && styles.actionButtonTextActive]}>
                {(beverage as any).featured ? 'Remove Feature' : 'Feature Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notFoundText: { fontSize: 18, color: Colors.textSecondary, marginBottom: 20 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  heroSection: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  featuredBadge: { position: 'absolute', top: 100, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  featuredText: { fontSize: 13, fontWeight: '600' as const, color: Colors.secondary },
  content: { marginTop: -30, backgroundColor: Colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 24 },
  titleSection: { paddingHorizontal: 20, marginBottom: 20 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 12 },
  typeBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase', letterSpacing: 0.5 },
  darkText: { color: Colors.accent },
  title: { fontSize: 28, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 18, color: Colors.textSecondary, marginBottom: 8 },
  originRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  originText: { fontSize: 14, color: Colors.textMuted },
  priceSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 20 },
  price: { fontSize: 32, fontWeight: '700' as const, color: Colors.primary },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  outOfStockBadge: { backgroundColor: Colors.error + '15' },
  stockText: { fontSize: 14, fontWeight: '600' as const, color: Colors.success },
  outOfStockText: { color: Colors.error },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 12 },
  descriptionText: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, paddingVertical: 16, borderRadius: 16, gap: 6 },
  statValue: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: 15, color: Colors.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: Colors.primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagText: { fontSize: 14, fontWeight: '500' as const, color: Colors.primary },
  actionsSection: { paddingHorizontal: 20, gap: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary },
  actionButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.primary },
  actionButtonTextActive: { color: Colors.white },
  bottomPadding: { height: 40 },
});
