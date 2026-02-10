import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  X,
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Smartphone,
  Wine,
  Beer,
  Martini,
  Coffee,
  GlassWater,
  Eye,
  RefreshCw,
  Check,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import AuthGuard from '@/components/AuthGuard';

const QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

export default function QRMenuScreen() {
  const router = useRouter();
  const { restaurant } = useRestaurant();
  const { wines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic } = useBeverages();

  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<'small' | 'medium' | 'large'>('medium');
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const menuSlug = restaurant?.menuSlug || restaurant?.id || 'menu';
  const menuUrl = `https://unbottl.app/m/${menuSlug}`;

  const qrSizes = { small: 200, medium: 280, large: 360 };

  const qrCodeUrl = useMemo(() => {
    const size = qrSizes[qrSize];
    const encodedUrl = encodeURIComponent(menuUrl);
    return `${QR_API_BASE}?data=${encodedUrl}&size=${size}x${size}&format=png&color=722F37&bgcolor=FFFFFF&margin=2`;
  }, [menuUrl, qrSize]);

  const menuStats = useMemo(() => {
    const inStockWines = wines.filter(w => w.inStock).length;
    const inStockBeers = beers.filter(b => b.inStock).length;
    const inStockSpirits = spirits.filter(s => s.inStock).length;
    const availableCocktails = cocktails.filter(c => c.isAvailable).length;
    const inStockNA = nonAlcoholic.filter(n => n.inStock).length;
    return {
      wines: inStockWines,
      beers: inStockBeers,
      spirits: inStockSpirits,
      cocktails: availableCocktails,
      nonAlcoholic: inStockNA,
      total: inStockWines + inStockBeers + inStockSpirits + availableCocktails + inStockNA,
    };
  }, [wines, beers, spirits, cocktails, nonAlcoholic]);

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        title: `${restaurant?.name || 'Restaurant'} - Digital Menu`,
        message: `Check out our digital beverage menu: ${menuUrl}`,
        url: menuUrl,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleCopyLink = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(menuUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        Alert.alert('Error', 'Failed to copy link');
      }
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Copied!', 'Menu link copied to clipboard');
    }
  };

  const handlePreview = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/customer-menu');
  };

  const handleQrPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const StatItem = ({ icon: Icon, label, count, color }: {
    icon: React.ElementType; label: string; count: number; color: string;
  }) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <AuthGuard requiredUserType="restaurant_owner">
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Menu</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <View style={styles.qrIconContainer}>
              <QrCode size={28} color={Colors.white} />
            </View>
            <Text style={styles.heroTitle}>Digital Menu QR Code</Text>
            <Text style={styles.heroSubtitle}>
              Let customers scan to browse your complete beverage menu on their phones
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleQrPress}
            style={styles.qrCardWrapper}
          >
            <Animated.View style={[styles.qrCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.qrHeader}>
                <Text style={styles.restaurantName}>{restaurant?.name || 'Your Restaurant'}</Text>
                <Text style={styles.qrHint}>Scan to view menu</Text>
              </View>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={[styles.qrImage, { width: qrSizes[qrSize], height: qrSizes[qrSize] }]}
                  contentFit="contain"
                  transition={300}
                />
              </View>
              <View style={styles.qrFooter}>
                <Smartphone size={14} color={Colors.textMuted} />
                <Text style={styles.qrFooterText}>Point camera to scan</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.sizeSelector}>
            <Text style={styles.sizeSelectorLabel}>QR Code Size</Text>
            <View style={styles.sizeButtons}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeButton, qrSize === size && styles.sizeButtonActive]}
                  onPress={() => setQrSize(size)}
                >
                  <Text style={[styles.sizeButtonText, qrSize === size && styles.sizeButtonTextActive]}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.linkSection}>
            <Text style={styles.linkLabel}>Menu Link</Text>
            <View style={styles.linkCard}>
              <Text style={styles.linkText} numberOfLines={1}>{menuUrl}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                {copied ? (
                  <Check size={18} color={Colors.success} />
                ) : (
                  <Copy size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Menu Contents</Text>
            <View style={styles.statsGrid}>
              <StatItem icon={Wine} label="Wines" count={menuStats.wines} color={Colors.wineRed} />
              <StatItem icon={Beer} label="Beers" count={menuStats.beers} color={Colors.secondary} />
              <StatItem icon={GlassWater} label="Spirits" count={menuStats.spirits} color={Colors.accent} />
              <StatItem icon={Martini} label="Cocktails" count={menuStats.cocktails} color={Colors.primary} />
              <StatItem icon={Coffee} label="Non-Alc" count={menuStats.nonAlcoholic} color={Colors.success} />
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Available Items</Text>
              <Text style={styles.totalCount}>{menuStats.total}</Text>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
              <Eye size={20} color={Colors.white} />
              <Text style={styles.previewButtonText}>Preview Customer View</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareFullButton} onPress={handleShare}>
              <Share2 size={20} color={Colors.primary} />
              <Text style={styles.shareButtonText}>Share Menu Link</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Print QR codes on table tents or menu cards</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Use larger size for posters and signage</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Test scanning before printing in bulk</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Menu updates appear instantly for customers</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' as const, color: Colors.text },
  shareButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  qrIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  heroTitle: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  qrCardWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  qrCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 8, borderWidth: 1, borderColor: Colors.borderLight },
  qrHeader: { alignItems: 'center', marginBottom: 20 },
  restaurantName: { fontSize: 18, fontWeight: '700' as const, color: Colors.primary, marginBottom: 4 },
  qrHint: { fontSize: 13, color: Colors.textMuted },
  qrContainer: { backgroundColor: Colors.white, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.borderLight },
  qrImage: { borderRadius: 8 },
  qrFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  qrFooterText: { fontSize: 13, color: Colors.textMuted },
  sizeSelector: { paddingHorizontal: 20, marginBottom: 24 },
  sizeSelectorLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted, marginBottom: 10 },
  sizeButtons: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.borderLight },
  sizeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  sizeButtonActive: { backgroundColor: Colors.primary },
  sizeButtonText: { fontSize: 14, fontWeight: '500' as const, color: Colors.textSecondary },
  sizeButtonTextActive: { color: Colors.white },
  linkSection: { paddingHorizontal: 20, marginBottom: 24 },
  linkLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted, marginBottom: 10 },
  linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  linkText: { flex: 1, fontSize: 14, color: Colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: Colors.primary + '10', borderRadius: 10 },
  statsSection: { paddingHorizontal: 20, marginBottom: 24 },
  statsTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderLight, gap: 12 },
  statItem: { width: '30%', alignItems: 'center', paddingVertical: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statCount: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primary + '08', marginTop: 12, padding: 16, borderRadius: 12 },
  totalLabel: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  totalCount: { fontSize: 22, fontWeight: '700' as const, color: Colors.primary },
  actionsSection: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  previewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, gap: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  previewButtonText: { fontSize: 16, fontWeight: '600' as const, color: Colors.white },
  shareFullButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, paddingVertical: 16, borderRadius: 14, gap: 10, borderWidth: 1.5, borderColor: Colors.primary },
  shareButtonText: { fontSize: 16, fontWeight: '600' as const, color: Colors.primary },
  tipsSection: { paddingHorizontal: 20 },
  tipsTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted, marginBottom: 12 },
  tipsList: { backgroundColor: Colors.secondary + '10', borderRadius: 16, padding: 16, gap: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.secondary, marginTop: 6 },
  tipText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  bottomPadding: { height: 40 },
});
