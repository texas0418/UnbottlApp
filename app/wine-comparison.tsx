import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Wine, Trash2, MapPin, Droplets, Grape, Percent } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useComparison } from '@/contexts/ComparisonContext';
import { wineTypeColors, wineTypeLabels } from '@/mocks/wines';
import { Wine as WineType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const flavorLabels: Record<string, string> = {
  body: 'Body',
  sweetness: 'Sweetness',
  tannins: 'Tannins',
  acidity: 'Acidity',
};

const flavorDescriptions: Record<string, [string, string]> = {
  body: ['Light', 'Full'],
  sweetness: ['Dry', 'Sweet'],
  tannins: ['Low', 'High'],
  acidity: ['Low', 'High'],
};

interface FlavorBarProps {
  value: number;
  color: string;
}

function FlavorBar({ value, color }: FlavorBarProps) {
  return (
    <View style={styles.flavorBarContainer}>
      <View style={styles.flavorBarBg}>
        <View style={[styles.flavorBarFill, { width: `${(value / 5) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.flavorValue}>{value}</Text>
    </View>
  );
}

interface ComparisonRowProps {
  label: string;
  wines: WineType[];
  renderValue: (wine: WineType) => React.ReactNode;
  icon?: React.ReactNode;
}

function ComparisonRow({ label, wines, renderValue, icon }: ComparisonRowProps) {
  return (
    <View style={styles.comparisonRow}>
      <View style={styles.rowLabelContainer}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowValues}>
        {wines.map((wine) => (
          <View key={wine.id} style={[styles.rowValue, { width: SCREEN_WIDTH / wines.length - 24 }]}>
            {renderValue(wine)}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function WineComparisonScreen() {
  const router = useRouter();
  const { compareWines, removeFromCompare, clearCompare } = useComparison();

  if (compareWines.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Wines</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Wine size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No wines to compare</Text>
          <Text style={styles.emptyText}>
            Select 2-3 wines from the menu to compare them side by side
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cardWidth = Math.min((SCREEN_WIDTH - 40) / compareWines.length, 150);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Wines</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearCompare}>
          <Trash2 size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.wineCardsContainer}>
          {compareWines.map((wine) => (
            <View key={wine.id} style={[styles.wineCard, { width: cardWidth }]}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCompare(wine.id)}
              >
                <X size={14} color={Colors.white} />
              </TouchableOpacity>
              <View style={[styles.wineIcon, { backgroundColor: wineTypeColors[wine.type] + '20' }]}>
                <Wine size={28} color={wineTypeColors[wine.type]} />
              </View>
              <View style={[styles.typeBadge, { backgroundColor: wineTypeColors[wine.type] }]}>
                <Text style={styles.typeBadgeText}>{wineTypeLabels[wine.type]}</Text>
              </View>
              <Text style={styles.wineName} numberOfLines={2}>{wine.name}</Text>
              <Text style={styles.wineProducer} numberOfLines={1}>{wine.producer}</Text>
              {wine.vintage && (
                <Text style={styles.wineVintage}>{wine.vintage}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.priceRow}>
            {compareWines.map((wine) => (
              <View key={wine.id} style={[styles.priceCard, { width: cardWidth }]}>
                <Text style={styles.priceLabel}>Bottle</Text>
                <Text style={styles.priceValue}>${wine.price}</Text>
                {wine.glassPrice && (
                  <>
                    <Text style={styles.priceLabel}>Glass</Text>
                    <Text style={styles.glassPriceValue}>${wine.glassPrice}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <ComparisonRow
            label="Region"
            wines={compareWines}
            icon={<MapPin size={14} color={Colors.textMuted} />}
            renderValue={(wine) => (
              <Text style={styles.detailText} numberOfLines={2}>
                {wine.region}, {wine.country}
              </Text>
            )}
          />

          <ComparisonRow
            label="Grape"
            wines={compareWines}
            icon={<Grape size={14} color={Colors.textMuted} />}
            renderValue={(wine) => (
              <Text style={styles.detailText} numberOfLines={1}>{wine.grape}</Text>
            )}
          />

          <ComparisonRow
            label="Alcohol"
            wines={compareWines}
            icon={<Percent size={14} color={Colors.textMuted} />}
            renderValue={(wine) => (
              <Text style={styles.detailText}>{wine.alcoholContent}%</Text>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flavor Profile</Text>
          {(['body', 'sweetness', 'tannins', 'acidity'] as const).map((profile) => (
            <View key={profile} style={styles.flavorRow}>
              <View style={styles.flavorLabelRow}>
                <Text style={styles.flavorLabel}>{flavorLabels[profile]}</Text>
                <View style={styles.flavorRange}>
                  <Text style={styles.flavorRangeText}>{flavorDescriptions[profile][0]}</Text>
                  <Text style={styles.flavorRangeText}>{flavorDescriptions[profile][1]}</Text>
                </View>
              </View>
              <View style={styles.flavorBarsRow}>
                {compareWines.map((wine) => (
                  <View key={wine.id} style={[styles.flavorBarWrapper, { width: cardWidth }]}>
                    <FlavorBar
                      value={wine.flavorProfile[profile]}
                      color={wineTypeColors[wine.type]}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasting Notes</Text>
          <View style={styles.notesRow}>
            {compareWines.map((wine) => (
              <View key={wine.id} style={[styles.notesCard, { width: cardWidth }]}>
                <Droplets size={16} color={wineTypeColors[wine.type]} />
                <Text style={styles.notesText} numberOfLines={4}>
                  {wine.tastingNotes || 'No tasting notes available'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Pairings</Text>
          <View style={styles.pairingsRow}>
            {compareWines.map((wine) => (
              <View key={wine.id} style={[styles.pairingsCard, { width: cardWidth }]}>
                {wine.foodPairings.length > 0 ? (
                  wine.foodPairings.slice(0, 4).map((pairing, index) => (
                    <View key={index} style={styles.pairingItem}>
                      <View style={[styles.pairingDot, { backgroundColor: wineTypeColors[wine.type] }]} />
                      <Text style={styles.pairingText} numberOfLines={1}>{pairing}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPairingsText}>No pairings listed</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  clearButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  wineCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
  },
  wineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  wineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  wineName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 17,
  },
  wineProducer: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  wineVintage: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    marginTop: 4,
  },
  priceSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  priceCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '15',
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  glassPriceValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  comparisonRow: {
    marginBottom: 16,
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  rowValues: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  rowValue: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  flavorRow: {
    marginBottom: 16,
  },
  flavorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  flavorLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  flavorRange: {
    flexDirection: 'row',
    gap: 8,
  },
  flavorRangeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  flavorBarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  flavorBarWrapper: {
    alignItems: 'center',
  },
  flavorBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  flavorBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  flavorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  flavorValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 18,
    textAlign: 'right',
  },
  notesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
    fontStyle: 'italic',
  },
  pairingsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pairingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  pairingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pairingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pairingText: {
    fontSize: 11,
    color: Colors.text,
    flex: 1,
  },
  noPairingsText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 40,
  },
});
