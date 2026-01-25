import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Wine,
  MapPin,
  Grape,
  Percent,
  Calendar,
  DollarSign,
  Droplets,
  Star,
  Edit3,
  Trash2,
  Package,
  Utensils,
  Bookmark,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import Button from '@/components/Button';

export default function WineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWineById, deleteWine, toggleStock } = useWines();
  const { isInWishlist, addToWishlist, removeByBeverageId, isAdding } = useWishlist();
  const { restaurant } = useRestaurant();
  
  const wine = getWineById(id || '');
  const isWishlisted = wine ? isInWishlist(wine.id) : false;

  if (!wine) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Wine not found</Text>
      </View>
    );
  }

  const typeColor = wineTypeColors[wine.type] || Colors.primary;
  const isLightType = wine.type === 'white' || wine.type === 'sparkling' || wine.type === 'rose';

  const handleEdit = () => {
    router.push(`/wine/edit/${wine.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Wine',
      `Are you sure you want to delete "${wine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWine(wine.id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleToggleStock = async () => {
    await toggleStock(wine.id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleWishlist = async () => {
    if (!wine) return;
    
    if (isWishlisted) {
      await removeByBeverageId(wine.id);
    } else {
      await addToWishlist({
        beverageId: wine.id,
        beverageName: wine.name,
        beverageCategory: 'wine',
        beverageType: wine.type,
        producer: wine.producer,
        price: wine.price,
        restaurantName: restaurant?.name || 'Unknown Restaurant',
        notes: '',
      });
    }
  };

  const detailItems = [
    { icon: MapPin, label: 'Region', value: `${wine.region}, ${wine.country}` },
    { icon: Grape, label: 'Grape', value: wine.grape },
    { icon: Percent, label: 'Alcohol', value: `${wine.alcoholContent}%` },
    { icon: Calendar, label: 'Vintage', value: wine.vintage?.toString() || 'NV' },
    { icon: Package, label: 'Quantity', value: `${wine.quantity} bottles` },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={handleToggleWishlist} 
                style={styles.headerButton}
                disabled={isAdding}
              >
                <Bookmark 
                  size={20} 
                  color={isWishlisted ? Colors.primary : Colors.textMuted} 
                  fill={isWishlisted ? Colors.primary : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Edit3 size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Trash2 size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: typeColor + '15' }]}>
          {wine.imageUrl ? (
            <Image source={{ uri: wine.imageUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <Wine size={80} color={typeColor} strokeWidth={1} />
          )}
          {wine.featured && (
            <View style={styles.featuredBadge}>
              <Star size={14} color={Colors.secondary} fill={Colors.secondary} />
              <Text style={styles.featuredText}>Featured</Text>
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
            <TouchableOpacity 
              style={[styles.stockBadge, !wine.inStock && styles.outOfStockBadge]}
              onPress={handleToggleStock}
            >
              <Droplets size={14} color={wine.inStock ? Colors.success : Colors.error} />
              <Text style={[styles.stockText, !wine.inStock && styles.outOfStockText]}>
                {wine.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{wine.name}</Text>
          <Text style={styles.producer}>{wine.producer}</Text>

          <View style={styles.priceSection}>
            <View style={styles.priceMain}>
              <DollarSign size={24} color={Colors.primary} />
              <Text style={styles.price}>{wine.price}</Text>
              <Text style={styles.priceLabel}>/ bottle</Text>
            </View>
            {wine.glassPrice && (
              <View style={styles.priceGlass}>
                <Text style={styles.glassPriceValue}>${wine.glassPrice}</Text>
                <Text style={styles.glassPriceLabel}>/ glass</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsCard}>
            {detailItems.map((item, index) => (
              <View key={item.label}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <item.icon size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
                {index < detailItems.length - 1 && <View style={styles.detailDivider} />}
              </View>
            ))}
          </View>

          {wine.tastingNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tasting Notes</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{wine.tastingNotes}</Text>
              </View>
            </View>
          )}

          {wine.foodPairings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Utensils size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Food Pairings</Text>
              </View>
              <View style={styles.pairingsContainer}>
                {wine.foodPairings.map((pairing, index) => (
                  <View key={index} style={styles.pairingChip}>
                    <Text style={styles.pairingText}>{pairing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsSection}>
            <Button
              title="Edit Wine"
              onPress={handleEdit}
              variant="secondary"
              icon={Edit3}
              fullWidth
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  darkText: {
    color: Colors.accent,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  outOfStockBadge: {
    backgroundColor: Colors.error + '15',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.success,
  },
  outOfStockText: {
    color: Colors.error,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 34,
  },
  producer: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  priceMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  priceLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  priceGlass: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  glassPriceValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  glassPriceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 64,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  notesText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  pairingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  pairingChip: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pairingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  actionsSection: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
