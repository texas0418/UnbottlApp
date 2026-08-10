import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Wine, Droplets, Star, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { card as cardTokens } from '@/constants/theme';
import { cardSwatch } from '@/utils/cardSwatch';
import { Wine as WineType } from '@/types';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import { useFavorites } from '@/contexts/FavoritesContext';

const NAME_LINE_HEIGHT = 24;

interface WineCardProps {
  wine: WineType;
  onPress: () => void;
  compact?: boolean;
  quickSave?: boolean;
  /**
   * Show the remaining bottle count. Owner and staff surfaces only — it is the
   * venue's inventory, not something to publish to guests. Defaults to false so
   * a new screen leaks nothing by forgetting to think about it.
   */
  showStock?: boolean;
}

// eslint-disable-next-line complexity -- tracked in #2
export default function WineCard({ wine, onPress, compact = false, quickSave = false, showStock = false }: WineCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(wine.id);

  const handleToggleFavorite = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(wine.id);
  };

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
  const swatch = cardSwatch(typeColor, Colors.surface);
  // A URL that 404s used to leave the same empty box as no URL at all.
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUri = imageFailed ? null : wine.imageUrl || null;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.compactCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.compactImageContainer, { backgroundColor: swatch.ground }]}>
            {wine.imageUrl ? (
              <Image source={{ uri: wine.imageUrl }} style={styles.compactImage} contentFit="cover" />
            ) : (
              <Wine size={24} color={swatch.ink} />
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
      style={styles.pressable}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.imageContainer, { backgroundColor: swatch.ground }]}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Wine size={44} color={swatch.ink} />
          )}
          {wine.featured && (
            <View style={styles.featuredBadge}>
              <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
            </View>
          )}
          {quickSave && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleToggleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                size={16}
                color={isFav ? Colors.error : Colors.textSecondary}
                fill={isFav ? Colors.error : 'none'}
              />
            </TouchableOpacity>
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
          
          <Text style={styles.name} numberOfLines={cardTokens.titleLines}>{wine.name}</Text>
          <Text style={styles.producer} numberOfLines={1}>{wine.producer}</Text>

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
            {(showStock || !wine.inStock) && (
              <View style={styles.stockIndicator}>
                <Droplets size={14} color={wine.inStock ? Colors.success : Colors.textMuted} />
                <Text style={[styles.stockText, !wine.inStock && styles.outOfStock]}>
                  {!wine.inStock ? 'Out' : `${wine.quantity} btl`}
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
  // A grid cell stretches to the height of the tallest card in its row (#6).
  // flexGrow rather than flex so the card still sizes to its content in the
  // scroll views and detail screens that render it outside a grid — `flex: 1`
  // sets flexBasis to 0 and would collapse it there.
  pressable: {
    flexGrow: 1,
  },
  card: {
    flexGrow: 1,
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
    width: '100%',
    aspectRatio: cardTokens.mediaAspectRatio,
    maxHeight: cardTokens.mediaMaxHeight,
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
  saveButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexGrow: 1,
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
    lineHeight: NAME_LINE_HEIGHT,
    // Reserved whether the title needs one line or two, so a short name and a
    // long one leave the rest of the card at the same height.
    minHeight: NAME_LINE_HEIGHT * cardTokens.titleLines,
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
    // Pinned to the bottom of the card. Any slack from a missing region line or
    // a one-line title collects above the rule instead of shortening the card,
    // so the price sits on the same baseline right across a row.
    marginTop: 'auto',
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
