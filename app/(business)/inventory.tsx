import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wine, Beer, Martini, Coffee, GlassWater, Package, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { BeverageCategory, Wine as WineType } from '@/types';
import WineCard from '@/components/WineCard';
import BeverageCard from '@/components/BeverageCard';
import SearchBar from '@/components/SearchBar';
import BusinessAuthPrompt from '@/components/BusinessAuthPrompt';
import { categoryColors } from '@/mocks/beverages';

const categoryTabs: { label: string; value: BeverageCategory | 'all'; icon: React.ReactNode }[] = [
  { label: 'All', value: 'all', icon: <Package size={18} color={Colors.textSecondary} /> },
  { label: 'Wine', value: 'wine', icon: <Wine size={18} color={categoryColors.wine} /> },
  { label: 'Beer', value: 'beer', icon: <Beer size={18} color={categoryColors.beer} /> },
  { label: 'Spirits', value: 'spirit', icon: <GlassWater size={18} color={categoryColors.spirit} /> },
  { label: 'Cocktails', value: 'cocktail', icon: <Martini size={18} color={categoryColors.cocktail} /> },
  { label: 'Non-Alc', value: 'non-alcoholic', icon: <Coffee size={18} color={categoryColors['non-alcoholic']} /> },
];

type Item = { id: string; category: BeverageCategory; data: any; searchText: string };

export default function InventoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { wines, beers, spirits, cocktails, nonAlcoholic } = useBeverages();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | 'all'>('all');

  const allItems = useMemo((): Item[] => {
    const items: Item[] = [];
    wines.forEach((w) =>
      items.push({ id: w.id, category: 'wine', data: w, searchText: `${w.name} ${w.producer}`.toLowerCase() })
    );
    beers.forEach((b) =>
      items.push({ id: b.id, category: 'beer', data: b, searchText: `${b.name} ${b.brewery}`.toLowerCase() })
    );
    spirits.forEach((s) =>
      items.push({ id: s.id, category: 'spirit', data: s, searchText: `${s.name} ${s.brand}`.toLowerCase() })
    );
    cocktails.forEach((c) =>
      items.push({ id: c.id, category: 'cocktail', data: c, searchText: `${c.name}`.toLowerCase() })
    );
    nonAlcoholic.forEach((n) =>
      items.push({ id: n.id, category: 'non-alcoholic', data: n, searchText: `${n.name}`.toLowerCase() })
    );
    return items;
  }, [wines, beers, spirits, cocktails, nonAlcoholic]);

  const filtered = useMemo(
    () =>
      allItems.filter((item) => {
        const matchesSearch = searchQuery === '' || item.searchText.includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [allItems, searchQuery, selectedCategory]
  );

  const counts: Record<string, number> = {
    all: allItems.length,
    wine: wines.length,
    beer: beers.length,
    spirit: spirits.length,
    cocktail: cocktails.length,
    'non-alcoholic': nonAlcoholic.length,
  };

  const openItem = (item: Item) => {
    if (item.category === 'wine') router.push(`/wine/${item.id}`);
    else router.push(`/beverage/${item.category}/${item.id}`);
  };

  if (!isAuthenticated) {
    return <BusinessAuthPrompt message="Sign in to add and manage your beverage inventory." />;
  }

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.count}>{allItems.length} items</Text>
      </View>
      <View style={styles.searchWrap}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search your inventory..." />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {categoryTabs.map((tab) => {
          const isSelected = selectedCategory === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, isSelected && styles.tabSelected]}
              onPress={() => setSelectedCategory(tab.value)}
            >
              <View style={styles.tabIcon}>
                {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                  color: isSelected ? Colors.white : Colors.textSecondary,
                })}
              </View>
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>{tab.label}</Text>
              <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {counts[tab.value]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.cardContainer}>
      {item.category === 'wine' ? (
        <WineCard wine={item.data as WineType} onPress={() => openItem(item)} />
      ) : (
        <BeverageCard beverage={item.data} category={item.category} onPress={() => openItem(item)} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.category}-${item.id}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Package size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {allItems.length === 0 ? 'No beverages yet' : 'No matches'}
            </Text>
            <Text style={styles.emptyText}>
              {allItems.length === 0
                ? 'Tap the + button to add your first beverage, or import a CSV.'
                : 'Try a different search or category.'}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/beverage/add')}
        activeOpacity={0.85}
      >
        <Plus size={26} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerArea: { paddingTop: 8, gap: 12, marginBottom: 8 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: '700' as const, color: Colors.primary, letterSpacing: -0.5 },
  count: { fontSize: 14, color: Colors.textSecondary },
  searchWrap: { paddingHorizontal: 20 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabIcon: { width: 20, alignItems: 'center' },
  tabLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  tabLabelSelected: { color: Colors.white },
  badge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  badgeTextSelected: { color: Colors.white },
  list: { paddingBottom: 100 },
  row: { paddingHorizontal: 20, gap: 16, marginBottom: 16 },
  cardContainer: { flex: 1 },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.text, marginTop: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
