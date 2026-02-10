import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Mail, Phone, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';

export default function RestaurantSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your restaurant name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }

    setLoading(true);

    try {
      // Create restaurant using the function we created
      const { data, error } = await supabase.rpc('create_restaurant_with_owner', {
        p_name: formData.name.trim(),
        p_email: formData.email.trim() || null,
        p_phone: formData.phone.trim() || null,
      });

      if (error) throw error;

      // Create default location
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          restaurant_id: data,
          name: 'Main Location',
          address: formData.address.trim() || null,
        });

      if (locationError) console.error('Location error:', locationError);

      Alert.alert(
        'Success!',
        'Your restaurant has been created. You can now manage your inventory and invite team members.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (err: any) {
      console.error('Error creating restaurant:', err);
      Alert.alert('Error', err.message || 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredUserType="restaurant_owner">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Building2 size={48} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Set Up Your Restaurant</Text>
              <Text style={styles.subtitle}>
                Tell us about your establishment to get started
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Building2 size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(v) => handleChange('name', v)}
                  placeholder="Restaurant Name *"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(v) => handleChange('email', v)}
                  placeholder="Business Email (optional)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Phone size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(v) => handleChange('phone', v)}
                  placeholder="Phone Number (optional)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <MapPin size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(v) => handleChange('address', v)}
                  placeholder="Address (optional)"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Restaurant</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.back()}
            >
              <Text style={styles.skipText}>I'll do this later</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
