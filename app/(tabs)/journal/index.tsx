import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Star, Plus, Calendar, MapPin, Wine, Trash2, Edit3, X, ChevronDown, Heart, Bookmark, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useJournal } from '@/contexts/JournalContext';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useWishlist } from '@/contexts/WishlistContext';
import EmptyState from '@/components/EmptyState';
import WineCard from '@/components/WineCard';
import BeverageCard from '@/components/BeverageCard';
import { JournalEntry, WineType, BeverageCategory } from '@/types';

type SavedTab = 'favorites' | 'wishlist' | 'notes';

const WINE_TYPES: { value: WineType; label: string; color: string }[] = [
  { value: 'red', label: 'Red', color: Colors.wineRed },
  { value: 'white', label: 'White', color: Colors.wineWhite },
  { value: 'rose', label: 'Rosé', color: Colors.wineRose },
  { value: 'sparkling', label: 'Sparkling', color: Colors.wineSparkling },
  { value: 'dessert', label: 'Dessert', color: Colors.wineDessert },
  { value: 'fortified', label: 'Fortified', color: '#8B4513' },
];

const OCCASIONS = [
  'Dinner Party',
  'Date Night',
  'Celebration',
  'Casual Evening',
  'Restaurant Visit',
  'Wine Tasting',
  'Gift',
  'Other',
];

// eslint-disable-next-line max-lines-per-function -- tracked in #2
export default function JournalScreen() {
  const router = useRouter();
  const { entries, isLoading, addEntry, updateEntry, deleteEntry, totalEntries, getAverageRating, isAdding } = useJournal();
  const { wines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic } = useBeverages();
  const { favoriteIds } = useFavorites();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<SavedTab>('favorites');

  // Favorites can be any drink category, keyed by beverage id.
  const favoriteDrinks = React.useMemo(() => {
    const tagged: { id: string; category: BeverageCategory; data: any }[] = [
      ...wines.map((w) => ({ id: w.id, category: 'wine' as BeverageCategory, data: w })),
      ...beers.map((b) => ({ id: b.id, category: 'beer' as BeverageCategory, data: b })),
      ...spirits.map((s) => ({ id: s.id, category: 'spirit' as BeverageCategory, data: s })),
      ...cocktails.map((c) => ({ id: c.id, category: 'cocktail' as BeverageCategory, data: c })),
      ...nonAlcoholic.map((n) => ({ id: n.id, category: 'non-alcoholic' as BeverageCategory, data: n })),
    ];
    const favSet = new Set(favoriteIds);
    return tagged.filter((t) => favSet.has(t.id));
  }, [wines, beers, spirits, cocktails, nonAlcoholic, favoriteIds]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showOccasionDropdown, setShowOccasionDropdown] = useState(false);

  const [formData, setFormData] = useState({
    beverageName: '',
    beverageType: 'red' as WineType,
    beverageCategory: 'wine' as BeverageCategory,
    producer: '',
    vintage: '',
    rating: 4,
    notes: '',
    occasion: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
  });

  const resetForm = () => {
    setFormData({
      beverageName: '',
      beverageType: 'red',
      beverageCategory: 'wine',
      producer: '',
      vintage: '',
      rating: 4,
      notes: '',
      occasion: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingEntry(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      beverageName: entry.beverageName,
      beverageType: entry.beverageType as WineType,
      beverageCategory: entry.beverageCategory,
      producer: entry.producer,
      vintage: entry.vintage?.toString() || '',
      rating: entry.rating,
      notes: entry.notes,
      occasion: entry.occasion,
      location: entry.location,
      date: entry.date.split('T')[0],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.beverageName.trim()) {
      Alert.alert('Error', 'Please enter a wine name');
      return;
    }

    try {
      const entryData = {
        beverageId: null,
        beverageCategory: formData.beverageCategory,
        beverageName: formData.beverageName.trim(),
        beverageType: formData.beverageType,
        producer: formData.producer.trim(),
        vintage: formData.vintage ? parseInt(formData.vintage) : null,
        rating: formData.rating,
        notes: formData.notes.trim(),
        occasion: formData.occasion,
        location: formData.location.trim(),
        date: formData.date,
        imageUrl: null,
      };

      if (editingEntry) {
        await updateEntry({ id: editingEntry.id, updates: entryData });
      } else {
        await addEntry(entryData);
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.log('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.beverageName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id);
            } catch (error) {
              console.log('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating: number, interactive: boolean = false, onPress?: (r: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => {
              if (interactive && onPress) {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onPress(star);
              }
            }}
          >
            <Star
              size={interactive ? 32 : 16}
              color={star <= rating ? Colors.secondary : Colors.borderLight}
              fill={star <= rating ? Colors.secondary : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getWineTypeColor = (type: string) => {
    return WINE_TYPES.find(t => t.value === type)?.color || Colors.primary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderEntry = useCallback(({ item }: { item: JournalEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={[styles.wineTypeBadge, { backgroundColor: getWineTypeColor(item.beverageType) }]}>
          <Text style={[styles.wineTypeText, item.beverageType === 'white' || item.beverageType === 'sparkling' ? styles.darkText : null]}>
            {item.beverageType.charAt(0).toUpperCase() + item.beverageType.slice(1)}
          </Text>
        </View>
        <View style={styles.entryActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
            <Edit3 size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.wineName}>{item.beverageName}</Text>
      {item.producer && <Text style={styles.producer}>{item.producer}</Text>}
      {item.vintage && <Text style={styles.vintage}>{item.vintage}</Text>}

      <View style={styles.ratingRow}>
        {renderStars(item.rating)}
      </View>

      {item.notes && (
        <Text style={styles.notes} numberOfLines={3}>{item.notes}</Text>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(item.date)}</Text>
        </View>
        {item.location && (
          <View style={styles.metaItem}>
            <MapPin size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        )}
      </View>
      {item.occasion && (
        <View style={styles.occasionTag}>
          <Text style={styles.occasionText}>{item.occasion}</Text>
        </View>
      )}
    </View>
  ), []);

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Wine size={24} color={Colors.primary} />
        <Text style={styles.statValue}>{totalEntries}</Text>
        <Text style={styles.statLabel}>Wines Tried</Text>
      </View>
      <View style={styles.statCard}>
        <Star size={24} color={Colors.secondary} fill={Colors.secondary} />
        <Text style={styles.statValue}>{getAverageRating.toFixed(1)}</Text>
        <Text style={styles.statLabel}>Avg Rating</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={Wine}
      title="Start your tasting journal"
      description="Track the drinks you try with personal notes and ratings — your own record of every great pour."
      actionLabel="Add your first note"
      onAction={openAddModal}
    />
  );

  const segments: { key: SavedTab; label: string; icon: typeof Heart; count: number }[] = [
    { key: 'favorites', label: 'Favorites', icon: Heart, count: favoriteDrinks.length },
    { key: 'wishlist', label: 'Wishlist', icon: Bookmark, count: wishlistItems.length },
    { key: 'notes', label: 'Notes', icon: BookOpen, count: entries.length },
  ];

  const renderSegments = () => (
    <View style={styles.segments}>
      {segments.map((seg) => {
        const isActive = activeTab === seg.key;
        return (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setActiveTab(seg.key);
            }}
            activeOpacity={0.7}
          >
            <seg.icon size={16} color={isActive ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
              {seg.label}
              {seg.count > 0 ? ` ${seg.count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFavorites = () => (
    <FlatList
      data={favoriteDrinks}
      keyExtractor={(item) => `${item.category}-${item.id}`}
      renderItem={({ item }) => (
        <View style={styles.favoriteRow}>
          {item.category === 'wine' ? (
            <WineCard wine={item.data} compact onPress={() => router.push(`/wine/${item.id}`)} />
          ) : (
            <BeverageCard
              beverage={item.data}
              category={item.category}
              compact
              onPress={() => router.push(`/beverage/${item.category}/${item.id}`)}
            />
          )}
        </View>
      )}
      contentContainerStyle={favoriteDrinks.length === 0 ? styles.emptyList : styles.listContent}
      ListEmptyComponent={
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any drink to save it here for quick access."
          actionLabel="Discover drinks"
          onAction={() => router.replace('/(tabs)/(home)')}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );

  const renderWishlistRow = ({ item }: { item: typeof wishlistItems[0] }) => (
    <View style={styles.wishlistRow}>
      <View style={styles.wishlistInfo}>
        <Text style={styles.wishlistName} numberOfLines={1}>{item.beverageName}</Text>
        {!!item.producer && (
          <Text style={styles.wishlistProducer} numberOfLines={1}>{item.producer}</Text>
        )}
        <View style={styles.wishlistMetaRow}>
          <Text style={styles.wishlistCategory}>{item.beverageCategory}</Text>
          {item.price > 0 && <Text style={styles.wishlistPrice}>${item.price}</Text>}
          {!!item.restaurantName && (
            <Text style={styles.wishlistVenue} numberOfLines={1}>· {item.restaurantName}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.wishlistRemove}
        onPress={() => removeFromWishlist(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderWishlist = () => (
    <FlatList
      data={wishlistItems}
      keyExtractor={(item) => item.id}
      renderItem={renderWishlistRow}
      contentContainerStyle={wishlistItems.length === 0 ? styles.emptyList : styles.listContent}
      ListEmptyComponent={
        <EmptyState
          icon={Bookmark}
          title="Your wishlist is empty"
          description="Save drinks you want to try. Scan a menu and tap the bookmark to add them here."
          actionLabel="Scan a menu"
          onAction={() => router.push('/scan-menu')}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSegments()}

      {activeTab === 'favorites' && renderFavorites()}
      {activeTab === 'wishlist' && renderWishlist()}
      {activeTab === 'notes' && (
        <>
          {entries.length > 0 && renderStats()}
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.listContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
          {entries.length > 0 && (
            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
              <Plus size={28} color={Colors.white} />
            </TouchableOpacity>
          )}
        </>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isAdding}>
              {isAdding ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wine Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.beverageName}
                onChangeText={(text) => setFormData({ ...formData, beverageName: text })}
                placeholder="e.g., Château Margaux"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wine Type</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <View style={styles.dropdownContent}>
                  <View style={[styles.typeIndicator, { backgroundColor: getWineTypeColor(formData.beverageType) }]} />
                  <Text style={styles.dropdownText}>
                    {WINE_TYPES.find(t => t.value === formData.beverageType)?.label}
                  </Text>
                </View>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showTypeDropdown && (
                <View style={styles.dropdownMenu}>
                  {WINE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, beverageType: type.value });
                        setShowTypeDropdown(false);
                      }}
                    >
                      <View style={[styles.typeIndicator, { backgroundColor: type.color }]} />
                      <Text style={styles.dropdownItemText}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Producer</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.producer}
                  onChangeText={(text) => setFormData({ ...formData, producer: text })}
                  placeholder="Winery name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, styles.vintageInput]}>
                <Text style={styles.inputLabel}>Vintage</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.vintage}
                  onChangeText={(text) => setFormData({ ...formData, vintage: text.replace(/[^0-9]/g, '') })}
                  placeholder="2020"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Rating</Text>
              <View style={styles.ratingInput}>
                {renderStars(formData.rating, true, (r) => setFormData({ ...formData, rating: r }))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tasting Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Describe the flavors, aromas, and your experience..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Occasion</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowOccasionDropdown(!showOccasionDropdown)}
              >
                <Text style={[styles.dropdownText, !formData.occasion && styles.placeholder]}>
                  {formData.occasion || 'Select occasion'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showOccasionDropdown && (
                <View style={styles.dropdownMenu}>
                  {OCCASIONS.map((occasion) => (
                    <TouchableOpacity
                      key={occasion}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, occasion });
                        setShowOccasionDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{occasion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Where did you try this wine?"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  favoriteRow: {
    marginBottom: 12,
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  wishlistInfo: {
    flex: 1,
  },
  wishlistName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  wishlistProducer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  wishlistMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  wishlistCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  wishlistPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  wishlistVenue: {
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  wishlistRemove: {
    padding: 6,
    marginLeft: 8,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wineTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wineTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  darkText: {
    color: Colors.text,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  wineName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  producer: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  vintage: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ratingRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  occasionTag: {
    marginTop: 10,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  occasionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addFirstButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  vintageInput: {
    width: 100,
  },
  ratingInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  bottomSpacer: {
    height: 40,
  },
});
