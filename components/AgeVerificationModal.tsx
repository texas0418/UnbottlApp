import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Wine, ShieldCheck, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface AgeVerificationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onDeny: () => void;
}

export default function AgeVerificationModal({
  visible,
  onConfirm,
  onDeny,
}: AgeVerificationModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Logo / Icon */}
          <View style={styles.iconContainer}>
            <Wine size={48} color={Colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Age Verification</Text>
          <Text style={styles.subtitle}>
            This app contains alcohol-related content. You must be at least 21 years old to continue.
          </Text>

          <Text style={styles.question}>Are you 21 or older?</Text>

          {/* Confirm button */}
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <ShieldCheck size={20} color={Colors.white} />
            <Text style={styles.confirmText}>Yes, I'm 21 or Older</Text>
          </TouchableOpacity>

          {/* Deny button */}
          <TouchableOpacity style={styles.denyButton} onPress={onDeny}>
            <Text style={styles.denyText}>No, I'm Under 21</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By confirming, you agree that you are of legal drinking age in your location. We do not sell or deliver alcohol.
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
    backgroundColor: Colors.background,
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    gap: 10,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  denyButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  denyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
