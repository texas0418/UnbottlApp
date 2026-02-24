import React, { useState, useEffect } from 'react';
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
import { Building2, Mail, Phone, MapPin, Plus, Check, ChevronRight, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import AuthGuard from '@/components/AuthGuard';

export default function RestaurantSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { restaurant, restaurants, needsSetup, updateRestaurant, switchRestaurant, refetch } = useRestaurant();
  const isEditing = !!restaurant && !needsSetup;

  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // New restaurant form (separate from edit form)
  const [newRestaurantData, setNewRestaurantData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Restaurant limit by plan
  const getRestaurantLimit = () => {
    if (restaurant?.is_founding_member) return 5; // Pro-level
    return 1; // Starter
  };

  const canAddRestaurant = (restaurants?.length || 0) < getRestaurantLimit();

  // Pre-fill form once on mount
  const [hasPreFilled, setHasPreFilled] = useState(false);
  useEffect(() => {
    if (restaurant && !hasPreFilled) {
      setFormData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: '',
      });
      setHasPreFilled(true);
    }
  }, [restaurant, hasPreFilled]);

  // Update form when switching restaurants
  const handleSwitchRestaurant = async (restaurantId: string) => {
    await switchRestaurant(restaurantId);
    const found = restaurants.find(r => r.id === restaurantId);
    if (found) {
      setFormData({
        name: found.name || '',
        email: found.email || '',
        phone: found.phone || '',
        address: '',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewChange = (field: string, value: string) => {
    setNewRestaurantData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
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
      if (isEditing) {
        const { error } = await updateRestaurant({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
        });

        if (error) throw error;

        refetch();
        Alert.alert('Saved!', 'Restaurant details updated.');
      } else {
        // First-time setup
        const { data, error } = await supabase.rpc('create_restaurant_with_owner', {
          p_name: formData.name.trim(),
          p_email: formData.email.trim() || null,
          p_phone: formData.phone.trim() || null,
        });

        if (error) throw error;

        if (formData.address.trim()) {
          await supabase
            .from('locations')
            .insert({
              restaurant_id: data,
              name: 'Main Location',
              address: formData.address.trim(),
            });
        }

        await refetch();
        Alert.alert(
          'Success!',
          'Your restaurant has been created.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      }
    } catch (err: any) {
      console.error('Error saving restaurant:', err);
      Alert.alert('Error', err.message || 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!canAddRestaurant) {
      Alert.alert(
        'Restaurant Limit Reached',
        `Your plan allows up to ${getRestaurantLimit()} restaurant${getRestaurantLimit() !== 1 ? 's' : ''}. Upgrade to add more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/pricing' as any) },
        ]
      );
      return;
    }

    if (!newRestaurantData.name.trim()) {
      Alert.alert('Error', 'Please enter a restaurant name');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_restaurant_with_owner', {
        p_name: newRestaurantData.name.trim(),
        p_email: newRestaurantData.email.trim() || null,
        p_phone: newRestaurantData.phone.trim() || null,
      });

      if (error) throw error;

      if (newRestaurantData.address.trim()) {
        await supabase
          .from('locations')
          .insert({
            restaurant_id: data,
            name: 'Main Location',
            address: newRestaurantData.address.trim(),
          });
      }

      await refetch();

      // Switch to the new restaurant
      await switchRestaurant(data);
      setFormData({
        name: newRestaurantData.name.trim(),
        email: newRestaurantData.email.trim(),
        phone: newRestaurantData.phone.trim(),
        address: '',
      });

      setNewRestaurantData({ name: '', email: '', phone: '', address: '' });
      setShowAddNew(false);

      Alert.alert('Success!', `${newRestaurantData.name.trim()} has been created.`);
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
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Building2 size={48} color={Colors.primary} />
              </View>
              <Text style={styles.title}>
                {isEditing ? 'Restaurant Details' : 'Set Up Your Restaurant'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditing
                  ? 'Update your restaurant information'
                  : 'Tell us about your establishment to get started'}
              </Text>
            </View>

            {/* Restaurant Switcher — only show if multiple restaurants */}
            {isEditing && restaurants.length > 1 && (
              <View style={styles.switcherSection}>
                <Text style={styles.switcherTitle}>Your Restaurants</Text>
                {restaurants.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.switcherItem,
                      r.id === restaurant?.id && styles.switcherItemActive,
                    ]}
                    onPress={() => handleSwitchRestaurant(r.id)}
                  >
                    <Building2
                      size={18}
                      color={r.id === restaurant?.id ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.switcherName,
                        r.id === restaurant?.id && styles.switcherNameActive,
                      ]}
                    >
                      {r.name}
                    </Text>
                    {r.id === restaurant?.id && (
                      <Check size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Edit Current Restaurant Form */}
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

              {!isEditing && (
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
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Save Changes' : 'Create Restaurant'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Add New Restaurant Section */}
            {isEditing && (
              <View style={styles.addSection}>
                {showAddNew ? (
                  <View style={styles.addNewForm}>
                    <Text style={styles.addNewTitle}>Add New Restaurant</Text>

                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Building2 size={20} color={Colors.textMuted} />
                      </View>
                      <TextInput
                        style={styles.input}
                        value={newRestaurantData.name}
                        onChangeText={(v) => handleNewChange('name', v)}
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
                        value={newRestaurantData.email}
                        onChangeText={(v) => handleNewChange('email', v)}
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
                        value={newRestaurantData.phone}
                        onChangeText={(v) => handleNewChange('phone', v)}
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
                        value={newRestaurantData.address}
                        onChangeText={(v) => handleNewChange('address', v)}
                        placeholder="Address (optional)"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.addNewButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowAddNew(false);
                          setNewRestaurantData({ name: '', email: '', phone: '', address: '' });
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.createButton, loading && { opacity: 0.7 }]}
                        onPress={handleAddRestaurant}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                          <Text style={styles.createButtonText}>Create</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addRestaurantButton}
                    onPress={() => {
                      if (!canAddRestaurant) {
                        Alert.alert(
                          'Restaurant Limit Reached',
                          `Your plan allows up to ${getRestaurantLimit()} restaurant${getRestaurantLimit() !== 1 ? 's' : ''}. Upgrade to add more.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'View Plans', onPress: () => router.push('/pricing' as any) },
                          ]
                        );
                      } else {
                        setShowAddNew(true);
                      }
                    }}
                  >
                    <Plus size={18} color={canAddRestaurant ? Colors.primary : Colors.textMuted} />
                    <Text style={[
                      styles.addRestaurantText,
                      !canAddRestaurant && { color: Colors.textMuted },
                    ]}>
                      {canAddRestaurant
                        ? 'Add Another Restaurant'
                        : `Upgrade to Add More (${restaurants.length}/${getRestaurantLimit()})`
                      }
                    </Text>
                    <ChevronRight size={16} color={canAddRestaurant ? Colors.primary : Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!isEditing && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backText}>I'll do this later</Text>
              </TouchableOpacity>
            )}
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
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  // Restaurant Switcher
  switcherSection: {
    marginBottom: 24,
  },
  switcherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  switcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  switcherItemActive: {
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
  },
  switcherName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  switcherNameActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Form
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
  // Add Restaurant Section
  addSection: {
    marginBottom: 24,
  },
  addRestaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  addRestaurantText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  addNewForm: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  addNewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  addNewButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight || '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  // Back button
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
