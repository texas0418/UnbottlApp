import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  QrCode,
  ScanLine,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface RecentMenu {
  id: string;
  restaurantName: string;
  cuisineType: string;
  location: string;
  imageUrl: string;
  lastVisited: string;
  rating?: number;
}

const recentMenus: RecentMenu[] = [
  {
    id: '1',
    restaurantName: 'Bella Vista',
    cuisineType: 'Italian',
    location: 'Downtown',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    lastVisited: '2 days ago',
    rating: 4.5,
  },
  {
    id: '2',
    restaurantName: 'The Wine Bar',
    cuisineType: 'Wine & Tapas',
    location: 'Midtown',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    lastVisited: '1 week ago',
    rating: 4.8,
  },
];

export default function MenuScreen() {
  const router = useRouter();
  const [recentlyViewed] = useState<RecentMenu[]>(recentMenus);

  const handleScanQR = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/menu-scanner');
  };

  const handleViewMenu = (menuId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/customer-menu');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <View style={styles.scanIconContainer}>
          <View style={styles.scanIconOuter}>
            <View style={styles.scanIconInner}>
              <QrCode size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
          </View>
          <View style={styles.scanPulse} />
        </View>
        <Text style={styles.heroTitle}>Scan Restaurant Menu</Text>
        <Text style={styles.heroSubtitle}>
          Scan a QR code to view the restaurant's beverage menu on your phone
        </Text>
      </View>

      <View style={styles.scanSection}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR} activeOpacity={0.8}>
          <View style={styles.scanButtonContent}>
            <View style={styles.scanButtonIcon}>
              <ScanLine size={28} color={Colors.white} />
            </View>
            <View style={styles.scanButtonText}>
              <Text style={styles.scanButtonTitle}>Scan QR Code</Text>
              <Text style={styles.scanButtonDesc}>Point your camera at a menu QR code</Text>
            </View>
          </View>
          <ChevronRight size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>1</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Find the QR code</Text>
              <Text style={styles.tipDesc}>Look for the QR code on the table or menu</Text>
            </View>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>2</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Scan with your camera</Text>
              <Text style={styles.tipDesc}>Tap the scan button and point at the code</Text>
            </View>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>3</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Browse & discover</Text>
              <Text style={styles.tipDesc}>Explore wines, cocktails, and more</Text>
            </View>
          </View>
        </View>
      </View>

      {recentlyViewed.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Clock size={18} color={Colors.textSecondary} />
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
            </View>
          </View>
          <View style={styles.recentList}>
            {recentlyViewed.map((menu) => (
              <TouchableOpacity
                key={menu.id}
                style={styles.recentCard}
                onPress={() => handleViewMenu(menu.id)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: menu.imageUrl }}
                  style={styles.recentImage}
                  contentFit="cover"
                />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{menu.restaurantName}</Text>
                  <View style={styles.recentMeta}>
                    <Utensils size={12} color={Colors.textSecondary} />
                    <Text style={styles.recentMetaText}>{menu.cuisineType}</Text>
                  </View>
                  <View style={styles.recentMeta}>
                    <MapPin size={12} color={Colors.textSecondary} />
                    <Text style={styles.recentMetaText}>{menu.location}</Text>
                  </View>
                  <View style={styles.recentFooter}>
                    <Text style={styles.recentTime}>{menu.lastVisited}</Text>
                    {menu.rating && (
                      <View style={styles.ratingBadge}>
                        <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                        <Text style={styles.ratingText}>{menu.rating}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why use Unbottl?</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Star size={20} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personalized picks</Text>
              <Text style={styles.featureDesc}>Get recommendations based on your taste</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Utensils size={20} color={Colors.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Food pairings</Text>
              <Text style={styles.featureDesc}>Discover perfect drink and food matches</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  scanIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  scanIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIconInner: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  scanPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  scanSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scanButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scanButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  scanButtonDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  tipsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  recentImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  recentMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  recentTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: 30,
  },
});
