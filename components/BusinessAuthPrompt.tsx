import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Compass } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAppMode } from '@/hooks/useAppMode';

/**
 * Shown on business screens when the visitor is browsing in restaurant mode
 * but hasn't signed in yet. Keeps guests from hitting AuthGuard redirects and
 * gives them a clear next step (sign in) or an escape hatch (switch to guest).
 */
export default function BusinessAuthPrompt({ message }: { message?: string }) {
  const router = useRouter();
  const { setMode } = useAppMode();

  const switchToConsumer = async () => {
    await setMode('consumer');
    router.replace('/(tabs)/(home)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Building2 size={44} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Sign in to manage your restaurant</Text>
          <Text style={styles.subtitle}>
            {message ??
              'Create a restaurant account to manage your beverage inventory, generate QR menus, and see analytics.'}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login?mode=signup')}
          >
            <Text style={styles.primaryText}>Create Restaurant Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.secondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.switchRow} onPress={switchToConsumer}>
          <Compass size={16} color={Colors.textSecondary} />
          <Text style={styles.switchText}>Just browsing? Switch to guest mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryText: { color: Colors.white, fontSize: 17, fontWeight: '600' as const },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryText: { color: Colors.primary, fontSize: 17, fontWeight: '600' as const },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  switchText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' as const },
});
