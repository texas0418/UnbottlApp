import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Wine, Beer, Martini, Coffee, GlassWater, Star, Droplets } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Beer as BeerType, Spirit, Cocktail, NonAlcoholicBeverage, BeverageCategory } from '@/types';
import { 
  beerTypeColors, beerTypeLabels,
  spiritTypeColors, spiritTypeLabels,
  cocktailTypeColors, cocktailTypeLabels,
  nonAlcoholicTypeColors, nonAlcoholicTypeLabels,
  categoryColors,
} from '@/mocks/beverages';

type BeverageItem = BeerType | Spirit | Cocktail | NonAlcoholicBeverage;

interface BeverageCardProps {
  beverage: BeverageItem;
  category: BeverageCategory;
  onPress: () => void;
  compact?: boolean;
}

const getCategoryIcon = (category: BeverageCategory, size: number, color: string) => {
  switch (category) {
    case 'wine':
      return <Wine size={size} color={color} />;
    case 'beer':
      return <Beer size={size} color={color} />;
    case 'spirit':
      return <GlassWater size={size} color={color} />;
    case 'cocktail':
      return <Martini size={size} color={color} />;
    case 'non-alcoholic':
      return <Coffee size={size} color={color} />;
    default:
      return <GlassWater size={size} color={color} />;
  }
};

const getTypeColor = (category: BeverageCategory, type: string): string => {
  switch (category) {
    case 'beer':
      return beerTypeColors[type] || categoryColors.beer;
    case 'spirit':
      return spiritTypeColors[type] || categoryColors.spirit;
    case 'cocktail':
      return cocktailTypeColors[type] || categoryColors.cocktail;
    case 'non-alcoholic':
      return nonAlcoholicTypeColors[type] || categoryColors['non-alcoholic'];
    default:
      return Colors.primary;
  }
};

const getTypeLabel = (category: BeverageCategory, type: string): string => {
  switch (category) {
    case 'beer':
      return beerTypeLabels[type] || type;
    case 'spirit':
      return spiritTypeLabels[type] || type;
    case 'cocktail':
      return cocktailTypeLabels[type] || type;
    case 'non-alcoholic':
      return nonAlcoholicTypeLabels[type] || type;
    default:
      return type;
  }
};

const getBeverageDetails = (beverage: BeverageItem, category: BeverageCategory) => {
  switch (category) {
    case 'beer': {
      const beer = beverage as BeerType;
      return {
        name: beer.name,
        subtitle: beer.brewery,
        type: beer.type,
        price: beer.price,
        secondaryPrice: null,
        secondaryLabel: beer.servingSize,
        region: beer.origin,
        inStock: beer.inStock,
        quantity: beer.quantity,
        featured: beer.featured,
        imageUrl: beer.imageUrl,
        extra: beer.abv ? `${beer.abv}% ABV` : null,
      };
    }
    case 'spirit': {
      const spirit = beverage as Spirit;
      return {
        name: spirit.name,
        subtitle: spirit.brand,
        type: spirit.type,
        price: spirit.price,
        secondaryPrice: spirit.shotPrice,
        secondaryLabel: spirit.shotPrice ? '/shot' : null,
        region: spirit.origin,
        inStock: spirit.inStock,
        quantity: spirit.quantity,
        featured: spirit.featured,
        imageUrl: spirit.imageUrl,
        extra: spirit.age || (spirit.abv ? `${spirit.abv}%` : null),
      };
    }
    case 'cocktail': {
      const cocktail = beverage as Cocktail;
      return {
        name: cocktail.name,
        subtitle: cocktail.baseSpirit,
        type: cocktail.type,
        price: cocktail.price,
        secondaryPrice: null,
        secondaryLabel: cocktail.glassType,
        region: null,
        inStock: cocktail.isAvailable,
        quantity: null,
        featured: cocktail.featured,
        imageUrl: cocktail.imageUrl,
        extra: cocktail.isSignature ? 'Signature' : null,
      };
    }
    case 'non-alcoholic': {
      const na = beverage as NonAlcoholicBeverage;
      return {
        name: na.name,
        subtitle: na.brand || 'House Made',
        type: na.type,
        price: na.price,
        secondaryPrice: null,
        secondaryLabel: na.servingSize,
        region: null,
        inStock: na.inStock,
        quantity: na.quantity,
        featured: na.featured,
        imageUrl: na.imageUrl,
        extra: na.calories ? `${na.calories} cal` : null,
      };
    }
    default:
      return {
        name: 'Unknown',
        subtitle: '',
        type: '',
        price: 0,
        secondaryPrice: null,
        secondaryLabel: null,
        region: null,
        inStock: false,
        quantity: null,
        featured: false,
        imageUrl: null,
        extra: null,
      };
  }
};

export default function BeverageCard({ beverage, category, onPress, compact = false }: BeverageCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const details = getBeverageDetails(beverage, category);
  const typeColor = getTypeColor(category, details.type);
  const isLightType = ['vodka', 'wheat', 'pilsner', 'water'].includes(details.type);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.compactCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.compactImageContainer, { backgroundColor: typeColor + '20' }]}>
            {details.imageUrl ? (
              <Image source={{ uri: details.imageUrl }} style={styles.compactImage} contentFit="cover" />
            ) : (
              getCategoryIcon(category, 24, typeColor)
            )}
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactName} numberOfLines={1}>{details.name}</Text>
            <Text style={styles.compactProducer} numberOfLines={1}>{details.subtitle}</Text>
            <View style={styles.compactFooter}>
              <View style={[styles.typeBadgeSmall, { backgroundColor: typeColor }]}>
                <Text style={[styles.typeBadgeTextSmall, isLightType && styles.darkText]}>
                  {getTypeLabel(category, details.type)}
                </Text>
              </View>
              <Text style={styles.compactPrice}>${details.price}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.imageContainer, { backgroundColor: typeColor + '15' }]}>
          {details.imageUrl ? (
            <Image source={{ uri: details.imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            getCategoryIcon(category, 48, typeColor)
          )}
          {details.featured && (
            <View style={styles.featuredBadge}>
              <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
            </View>
          )}
          {!details.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>
                {category === 'cocktail' ? 'Unavailable' : 'Out of Stock'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={[styles.typeBadgeText, isLightType && styles.darkText]}>
                {getTypeLabel(category, details.type)}
              </Text>
            </View>
            {details.extra && (
              <Text style={styles.extraInfo}>{details.extra}</Text>
            )}
          </View>
          
          <Text style={styles.name} numberOfLines={2}>{details.name}</Text>
          <Text style={styles.producer}>{details.subtitle}</Text>
          
          {details.region && (
            <View style={styles.details}>
              <Text style={styles.region} numberOfLines={1}>
                {details.region}
              </Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${details.price}</Text>
              {details.secondaryPrice && details.secondaryLabel && (
                <Text style={styles.glassPrice}>${details.secondaryPrice}{details.secondaryLabel}</Text>
              )}
              {!details.secondaryPrice && details.secondaryLabel && (
                <Text style={styles.glassPrice}>{details.secondaryLabel}</Text>
              )}
            </View>
            {details.quantity !== null && (
              <View style={styles.stockIndicator}>
                <Droplets size={14} color={details.inStock ? Colors.success : Colors.textMuted} />
                <Text style={[styles.stockText, !details.inStock && styles.outOfStock]}>
                  {details.inStock ? details.quantity : 'Out'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  darkText: {
    color: Colors.accent,
  },
  extraInfo: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
    lineHeight: 22,
  },
  producer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  details: {
    marginBottom: 10,
  },
  region: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceContainer: {
    gap: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  glassPrice: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  outOfStock: {
    color: Colors.textMuted,
  },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  compactImageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  compactProducer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeTextSmall: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
  compactPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
