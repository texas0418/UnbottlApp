import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Wine,
  Beer,
  GlassWater,
  Martini,
  Coffee,
  Trash2,
  MapPin,
  Clock,
  Edit3,
  Check,
  Heart,
  Bookmark,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWishlist, WishlistItem } from '@/contexts/WishlistContext';
import { BeverageCategory } from '@/types';
import EmptyState from '@/components/EmptyState';

const getCategoryIcon = (category: BeverageCategory, size: number, color: string) => {
  switch (category) {
    case 'beer': return <Beer size={size} color={color} />;
    case 'spirit': return <GlassWater size={size} color={color} />;
    case 'cocktail': return <Martini size={size} color={color} />;
    case 'non-alcoholic': return <Coffee size={size} color={color} />;
    default: return <Wine size={size} color={color} />;
  }
};

const categoryColors: Record<BeverageCategory, string> = {
  wine: '#722F37',
  beer: '#D4A017',
  spirit: '#4A5568',
  cocktail: '#E91E63',
  'non-alcoholic': '#2E7D32',
};

const categoryLabels: Record<BeverageCategory, string> = {
  wine: 'Wine',
  beer: 'Beer',
  spirit: 'Spirit',
  cocktail: 'Cocktail',
  'non-alcoholic': 'Non-Alcoholic',
};

function WishlistCard({ 
  item, 
  onRemove, 
  onUpdateNotes 
}: { 
  item: WishlistItem; 
  onRemove: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(item.notes);
  const color = categoryColors[item.beverageCategory];
  
  const handleSaveNotes = () => {
    onUpdateNotes(notesText);
    setIsEditingNotes(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: color + '15' }]}>
          {getCategoryIcon(item.beverageCategory, 24, color)}
        </View>
        <View style={styles.cardHeaderContent}>
          <View style={[styles.categoryBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color }]}>
              {categoryLabels[item.beverageCategory]}
            </Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.beverageName}</Text>
          <Text style={styles.cardSubtitle}>{item.producer}</Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{item.restaurantName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>Added {formatDate(item.addedAt)}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Price</Text>
        <Text style={styles.priceValue}>${item.price}</Text>
      </View>

      <View style={styles.notesSection}>
        <View style={styles.notesHeader}>
          <Text style={styles.notesLabel}>Notes</Text>
          {!isEditingNotes ? (
            <TouchableOpacity onPress={() => setIsEditingNotes(true)} style={styles.editButton}>
              <Edit3 size={14} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSaveNotes} style={styles.editButton}>
              <Check size={14} color={Colors.success} />
            </TouchableOpacity>
          )}
        </View>
        {isEditingNotes ? (
          <TextInput
            style={styles.notesInput}
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Add a note (e.g., 'Try with steak', 'Birthday dinner')"
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
          />
        ) : (
          <Text style={styles.notesText}>
            {item.notes || 'Tap edit to add notes...'}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function WishlistScreen() {
  const router = useRouter();
  const { 
    wishlistItems, 
    isLoading, 
    removeFromWishlist, 
    updateNotes, 
    clearWishlist,
    wishlistCount 
  } = useWishlist();
  
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | 'all'>('all');

  const handleClose = () => {
    router.back();
  };

  const handleRemoveItem = (itemId: string, beverageName: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove "${beverageName}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromWishlist(itemId);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearWishlist();
          },
        },
      ]
    );
  };

  const filteredItems = selectedCategory === 'all' 
    ? wishlistItems 
    : wishlistItems.filter(item => item.beverageCategory === selectedCategory);

  const categories: Array<BeverageCategory | 'all'> = ['all', 'wine', 'beer', 'spirit', 'cocktail', 'non-alcoholic'];
  
  const getCategoryCount = (category: BeverageCategory | 'all') => {
    if (category === 'all') return wishlistItems.length;
    return wishlistItems.filter(item => item.beverageCategory === category).length;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Bookmark size={20} color={Colors.primary} fill={Colors.primary} />
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        {wishlistCount > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {wishlistCount > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {categories.map((category) => {
              const count = getCategoryCount(category);
              if (category !== 'all' && count === 0) return null;
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === category && styles.filterChipTextActive,
                    ]}
                  >
                    {category === 'all' ? 'All' : categoryLabels[category]} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={wishlistCount === 0 ? styles.emptyContent : undefined}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading wishlist...</Text>
          </View>
        ) : wishlistCount === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="Save beverages you want to try later. Browse menus and tap the bookmark icon to add items here."
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Wine}
            title="No Items in This Category"
            description="Try selecting a different category filter."
          />
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Text>
            {filteredItems.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                onRemove={() => handleRemoveItem(item.id, item.beverageName)}
                onUpdateNotes={(notes) => updateNotes({ itemId: item.id, notes })}
              />
            ))}
            <View style={styles.bottomPadding} />
          </>
        )}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  removeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  notesSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  notesInput: {
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bottomPadding: {
    height: 40,
  },
});
