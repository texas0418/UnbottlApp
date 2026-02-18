import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wine, ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const AGE_VERIFIED_KEY = 'unbottl_age_verified';

export default function AgeVerificationModal() {
  const { isAuthenticated, isAgeVerified: authAgeVerified } = useAuth();
  const [visible, setVisible] = useState(false);
  const [localVerified, setLocalVerified] = useState(true); // default true to avoid flash

  useEffect(() => {
    checkAgeVerification();
  }, [isAuthenticated, authAgeVerified]);

  const checkAgeVerification = async () => {
    // Authenticated users who are already verified don't need the modal
    if (isAuthenticated && authAgeVerified) {
      setLocalVerified(true);
      setVisible(false);
      return;
    }

    // Check local storage for guest users (or unverified authenticated users)
    try {
      const stored = await AsyncStorage.getItem(AGE_VERIFIED_KEY);
      if (stored === 'true') {
        setLocalVerified(true);
        setVisible(false);
      } else {
        setLocalVerified(false);
        setVisible(true);
      }
    } catch {
      setLocalVerified(false);
      setVisible(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await AsyncStorage.setItem(AGE_VERIFIED_KEY, 'true');
    } catch {}
    setLocalVerified(true);
    setVisible(false);
  };

  const handleDeny = () => {
    Alert.alert(
      'Access Restricted',
      'You must be 21 or older to use Unbottl. If you believe this is an error, please contact support@unbottl.com.',
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <ShieldCheck size={48} color={Colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Age Verification</Text>
          <Text style={styles.subtitle}>
            This app contains alcohol-related content.
          </Text>
          <Text style={styles.body}>
            You must be 21 years of age or older to use Unbottl. By continuing, you confirm that you meet the legal drinking age requirement.
          </Text>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmText}>I am 21 or older</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.denyButton}
            onPress={handleDeny}
          >
            <Text style={styles.denyText}>I am under 21</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            By using Unbottl you agree to our Terms of Service and Privacy Policy. Unbottl does not sell or facilitate the sale of alcohol.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  denyButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  denyText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  legal: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
