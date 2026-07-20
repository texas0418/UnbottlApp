import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Wine, Compass, Building2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useAppMode, AppMode } from '@/hooks/useAppMode';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setMode } = useAppMode();

  const choose = async (mode: AppMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setMode(mode);
    if (mode === 'business') {
      router.replace('/(business)/dashboard');
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[Colors.primary + '18', Colors.background]}
        style={styles.gradient}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Wine size={44} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.brand}>Unbottl</Text>
          <Text style={styles.tagline}>How will you be using Unbottl?</Text>
          <Text style={styles.subtag}>
            Pick the experience that fits you. You can switch anytime.
          </Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => choose('consumer')}
          >
            <View style={[styles.cardIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Compass size={30} color={Colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I'm here to discover drinks</Text>
              <Text style={styles.cardDesc}>
                Find and save wines, cocktails, beers and more. Scan menus at
                restaurants and get AI recommendations.
              </Text>
            </View>
            <ChevronRight size={22} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => choose('business')}
          >
            <View style={[styles.cardIcon, { backgroundColor: Colors.secondary + '25' }]}>
              <Building2 size={30} color={Colors.secondary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I manage a restaurant</Text>
              <Text style={styles.cardDesc}>
                Manage your beverage inventory, generate QR code menus, and
                track what your guests love.
              </Text>
            </View>
            <ChevronRight size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          You can change this later from your profile.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  brand: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtag: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  cards: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  footnote: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
  },
});
