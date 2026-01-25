import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Wine, Droplets, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Wine as WineType } from '@/types';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';

interface WineCardProps {
  wine: WineType;
  onPress: () => void;
  compact?: boolean;
}

export default function WineCard({ wine, onPress, compact = false }: WineCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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

  const typeColor = wineTypeColors[wine.type] || Colors.primary;
  const isLightType = wine.type === 'white' || wine.type === 'sparkling' || wine.type === 'rose';

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
            {wine.imageUrl ? (
              <Image source={{ uri: wine.imageUrl }} style={styles.compactImage} contentFit="cover" />
            ) : (
              <Wine size={24} color={typeColor} />
            )}
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactName} numberOfLines={1}>{wine.name}</Text>
            <Text style={styles.compactProducer} numberOfLines={1}>{wine.producer}</Text>
            <View style={styles.compactFooter}>
              <View style={[styles.typeBadgeSmall, { backgroundColor: typeColor }]}>
                <Text style={[styles.typeBadgeTextSmall, isLightType && styles.darkText]}>
                  {wine.type}
                </Text>
              </View>
              <Text style={styles.compactPrice}>${wine.price}</Text>
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
          {wine.imageUrl ? (
            <Image source={{ uri: wine.imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <Wine size={48} color={typeColor} />
          )}
          {wine.featured && (
            <View style={styles.featuredBadge}>
              <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
            </View>
          )}
          {!wine.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={[styles.typeBadgeText, isLightType && styles.darkText]}>
                {wineTypeLabels[wine.type]}
              </Text>
            </View>
            {wine.vintage && (
              <Text style={styles.vintage}>{wine.vintage}</Text>
            )}
          </View>
          
          <Text style={styles.name} numberOfLines={2}>{wine.name}</Text>
          <Text style={styles.producer}>{wine.producer}</Text>
          
          <View style={styles.details}>
            <Text style={styles.region} numberOfLines={1}>
              {wine.region}, {wine.country}
            </Text>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${wine.price}</Text>
              {wine.glassPrice && (
                <Text style={styles.glassPrice}>${wine.glassPrice}/glass</Text>
              )}
            </View>
            <View style={styles.stockIndicator}>
              <Droplets size={14} color={wine.inStock ? Colors.success : Colors.textMuted} />
              <Text style={[styles.stockText, !wine.inStock && styles.outOfStock]}>
                {wine.inStock ? `${wine.quantity} btl` : 'Out'}
              </Text>
            </View>
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
    height: 160,
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
    top: 12,
    right: 12,
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
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  darkText: {
    color: Colors.accent,
  },
  vintage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  producer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  details: {
    marginBottom: 12,
  },
  region: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceContainer: {
    gap: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  glassPrice: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 12,
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
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
  compactPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
