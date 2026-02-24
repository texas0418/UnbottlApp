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
import { Building2, Mail, Phone, MapPin, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import AuthGuard from '@/components/AuthGuard';

export default function RestaurantSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { restaurant, locations, needsSetup, updateRestaurant, refetch } = useRestaurant();
  const isEditing = !!restaurant && !needsSetup;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Location management
  const [showLocations, setShowLocations] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  // Pre-fill form when editing an existing restaurant
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: '', // Keep empty — address field is used to add new locations
      });
    }
  }, [restaurant]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewLocationChange = (field: string, value: string) => {
    setNewLocation(prev => ({ ...prev, [field]: value }));
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
      if (isEditing) {
        // Update existing restaurant
        const { error } = await updateRestaurant({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
        });

        if (error) throw error;

        // If address was entered, create a new location for it
        const trimmedAddress = formData.address.trim();
        if (trimmedAddress && restaurant) {
          // Check if this address already exists as a location
          const addressExists = locations?.some(
            loc => loc.address?.toLowerCase() === trimmedAddress.toLowerCase()
          );

          if (!addressExists) {
            // Check location limit before adding
            if ((locations?.length || 0) >= getLocationLimit()) {
              await refetch();
              setFormData(prev => ({ ...prev, address: '' }));
              setShowLocations(true);
              Alert.alert(
                'Restaurant Updated',
                `Your details have been saved, but the new location could not be added — your plan allows up to ${getLocationLimit()} location${getLocationLimit() !== 1 ? 's' : ''}. Upgrade to add more.`,
                [
                  { text: 'OK' },
                  { text: 'View Plans', onPress: () => router.push('/pricing' as any) },
                ]
              );
              return;
            }

            const { error: locError } = await supabase
              .from('locations')
              .insert({
                restaurant_id: restaurant.id,
                name: trimmedAddress.split(',')[0] || 'New Location',
                address: trimmedAddress,
              });
            if (locError) console.error('Location add error:', locError);
          }
        }

        await refetch();

        // Clear the address field after saving so it's ready for a new one
        setFormData(prev => ({ ...prev, address: '' }));

        // Expand locations section so user can see the update
        setShowLocations(true);

        Alert.alert('Saved!', 'Your restaurant details have been updated.');
      } else {
        // Create new restaurant
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

        await refetch();

        Alert.alert(
          'Success!',
          'Your restaurant has been created. You can now manage your inventory and invite team members.',
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

  // Location limits by plan
  const getLocationLimit = () => {
    if (restaurant?.is_founding_member) return 5; // Pro-level access
    // Default to Starter tier (1 location) — expand when Stripe subscription is wired up
    return 1;
  };

  const canAddLocation = (locations?.length || 0) < getLocationLimit();

  const handleAddLocation = async () => {
    if (!canAddLocation) {
      Alert.alert(
        'Location Limit Reached',
        `Your current plan allows up to ${getLocationLimit()} location${getLocationLimit() !== 1 ? 's' : ''}. Upgrade to add more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/pricing' as any) },
        ]
      );
      return;
    }

    if (!newLocation.name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    if (!restaurant) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('locations')
        .insert({
          restaurant_id: restaurant.id,
          name: newLocation.name.trim(),
          address: newLocation.address.trim() || null,
          city: newLocation.city.trim() || null,
          state: newLocation.state.trim() || null,
          zip_code: newLocation.zip_code.trim() || null,
        });

      if (error) throw error;

      await refetch();
      setNewLocation({ name: '', address: '', city: '', state: '', zip_code: '' });
      setAddingLocation(false);
      Alert.alert('Success', 'New location added!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add location');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = (locationId: string, locationName: string) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to remove "${locationName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('locations')
                .delete()
                .eq('id', locationId);
              if (error) {
                console.error('Delete location error:', JSON.stringify(error));
                throw error;
              }
              await refetch();
            } catch (err: any) {
              console.error('Delete location failed:', err);
              Alert.alert('Error', err.message || 'Failed to delete location. You may not have permission.');
            }
          },
        },
      ]
    );
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
              <Text style={styles.title}>
                {isEditing ? 'Restaurant Details' : 'Set Up Your Restaurant'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditing
                  ? 'Update your restaurant information'
                  : 'Tell us about your establishment to get started'}
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
                  placeholder={isEditing ? "Add new location address" : "Address (optional)"}
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
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Save Changes' : 'Create Restaurant'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Locations Section — only show when editing */}
            {isEditing && (
              <View style={styles.locationsSection}>
                <TouchableOpacity
                  style={styles.locationsSectionHeader}
                  onPress={() => setShowLocations(!showLocations)}
                >
                  <View>
                    <Text style={styles.locationsSectionTitle}>Locations</Text>
                    <Text style={styles.locationsSectionCount}>
                      {locations?.length || 0} location{(locations?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {showLocations
                    ? <ChevronUp size={20} color={Colors.textMuted} />
                    : <ChevronDown size={20} color={Colors.textMuted} />
                  }
                </TouchableOpacity>

                {showLocations && (
                  <View style={styles.locationsContent}>
                    {/* Existing locations */}
                    {locations?.map((loc) => (
                      <View key={loc.id} style={styles.locationCard}>
                        <View style={styles.locationInfo}>
                          <Text style={styles.locationName}>{loc.name}</Text>
                          {loc.address && (
                            <Text style={styles.locationAddress}>{loc.address}</Text>
                          )}
                          {(loc.city || loc.state || loc.zip_code) && (
                            <Text style={styles.locationAddress}>
                              {[loc.city, loc.state, loc.zip_code].filter(Boolean).join(', ')}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteLocation(loc.id, loc.name)}
                          style={styles.deleteLocationButton}
                        >
                          <Trash2 size={16} color={Colors.error || '#DC2626'} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add new location */}
                    {addingLocation ? (
                      <View style={styles.newLocationForm}>
                        <TextInput
                          style={styles.newLocationInput}
                          value={newLocation.name}
                          onChangeText={(v) => handleNewLocationChange('name', v)}
                          placeholder="Location Name *"
                          placeholderTextColor={Colors.textMuted}
                          autoCapitalize="words"
                        />
                        <TextInput
                          style={styles.newLocationInput}
                          value={newLocation.address}
                          onChangeText={(v) => handleNewLocationChange('address', v)}
                          placeholder="Address"
                          placeholderTextColor={Colors.textMuted}
                          autoCapitalize="words"
                        />
                        <View style={styles.cityStateRow}>
                          <TextInput
                            style={[styles.newLocationInput, { flex: 2 }]}
                            value={newLocation.city}
                            onChangeText={(v) => handleNewLocationChange('city', v)}
                            placeholder="City"
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="words"
                          />
                          <TextInput
                            style={[styles.newLocationInput, { flex: 1 }]}
                            value={newLocation.state}
                            onChangeText={(v) => handleNewLocationChange('state', v)}
                            placeholder="State"
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="characters"
                          />
                          <TextInput
                            style={[styles.newLocationInput, { flex: 1 }]}
                            value={newLocation.zip_code}
                            onChangeText={(v) => handleNewLocationChange('zip_code', v)}
                            placeholder="ZIP"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="number-pad"
                          />
                        </View>
                        <View style={styles.newLocationButtons}>
                          <TouchableOpacity
                            style={styles.cancelLocationButton}
                            onPress={() => {
                              setAddingLocation(false);
                              setNewLocation({ name: '', address: '', city: '', state: '', zip_code: '' });
                            }}
                          >
                            <Text style={styles.cancelLocationText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.addLocationConfirmButton, loading && { opacity: 0.7 }]}
                            onPress={handleAddLocation}
                            disabled={loading}
                          >
                            {loading ? (
                              <ActivityIndicator color={Colors.white} size="small" />
                            ) : (
                              <Text style={styles.addLocationConfirmText}>Add Location</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.addLocationButton,
                          !canAddLocation && styles.addLocationButtonDisabled,
                        ]}
                        onPress={() => {
                          if (!canAddLocation) {
                            Alert.alert(
                              'Location Limit Reached',
                              `Your current plan allows up to ${getLocationLimit()} location${getLocationLimit() !== 1 ? 's' : ''}. Upgrade to add more.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'View Plans', onPress: () => router.push('/pricing' as any) },
                              ]
                            );
                          } else {
                            setAddingLocation(true);
                          }
                        }}
                      >
                        <Plus size={18} color={canAddLocation ? Colors.primary : Colors.textMuted} />
                        <Text style={[
                          styles.addLocationText,
                          !canAddLocation && { color: Colors.textMuted },
                        ]}>
                          {canAddLocation ? 'Add Location' : `Upgrade to Add More (${locations?.length}/${getLocationLimit()})`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.back()}
            >
              <Text style={styles.skipText}>
                {isEditing ? 'Cancel' : "I'll do this later"}
              </Text>
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
  // Locations section
  locationsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  locationsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  locationsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  locationsSectionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  locationAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteLocationButton: {
    padding: 8,
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 4,
  },
  addLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  addLocationButtonDisabled: {
    borderColor: Colors.textMuted + '30',
  },
  newLocationForm: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    gap: 10,
  },
  newLocationInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  cityStateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  newLocationButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelLocationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight || '#E5E7EB',
  },
  cancelLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  addLocationConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  addLocationConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
