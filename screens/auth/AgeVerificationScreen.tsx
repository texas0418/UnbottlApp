// screens/auth/AgeVerificationScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

interface AgeVerificationScreenProps {
  navigation: any;
}

export default function AgeVerificationScreen({ navigation }: AgeVerificationScreenProps) {
  const { verifyAge, loading } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleVerify = async () => {
    const age = calculateAge(dateOfBirth);

    if (age < 21) {
      Alert.alert(
        'Age Requirement',
        'You must be 21 years or older to use Unbottl. This app contains alcohol-related content.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { error } = await verifyAge(dateOfBirth);

    if (error) {
      Alert.alert('Verification Failed', error.message);
    } else {
      // Navigate to main app
      navigation.replace('Main');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="wine" size={60} color="#722F37" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Age Verification</Text>
        <Text style={styles.subtitle}>
          Unbottl contains alcohol-related content. Please verify your age to continue.
        </Text>

        {/* Date Picker */}
        <View style={styles.dateSection}>
          <Text style={styles.label}>Date of Birth</Text>

          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateButtonText}>{formatDate(dateOfBirth)}</Text>
            </TouchableOpacity>
          )}

          {showPicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              style={styles.datePicker}
            />
          )}
        </View>

        {/* Age Display */}
        <View style={styles.ageDisplay}>
          <Text style={styles.ageText}>
            Age: <Text style={styles.ageNumber}>{calculateAge(dateOfBirth)}</Text> years old
          </Text>
        </View>

        {/* Legal Notice */}
        <View style={styles.notice}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.noticeText}>
            By verifying your age, you confirm that you are legally allowed to purchase and consume alcoholic beverages in your jurisdiction.
          </Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>

        {/* Skip for now (if not required) */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  dateSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  datePicker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  ageDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ageText: {
    fontSize: 18,
    color: '#666',
  },
  ageNumber: {
    fontWeight: 'bold',
    color: '#722F37',
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#722F37',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
