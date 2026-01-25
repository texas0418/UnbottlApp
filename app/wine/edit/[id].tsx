import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X, Plus, Check, Sparkles } from 'lucide-react-native';
import { generateText } from '@/services/ai-toolkit';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { WineType } from '@/types';

const wineTypes: { label: string; value: WineType }[] = [
  { label: 'Red', value: 'red' },
  { label: 'White', value: 'white' },
  { label: 'Rosé', value: 'rose' },
  { label: 'Sparkling', value: 'sparkling' },
  { label: 'Dessert', value: 'dessert' },
  { label: 'Fortified', value: 'fortified' },
];

export default function EditWineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWineById, updateWine } = useWines();

  const wine = getWineById(id || '');

  const [formData, setFormData] = useState({
    name: '',
    producer: '',
    type: 'red' as WineType,
    vintage: '',
    region: '',
    country: '',
    grape: '',
    alcoholContent: '',
    price: '',
    glassPrice: '',
    tastingNotes: '',
    quantity: '',
    imageUrl: '',
  });

  const [foodPairings, setFoodPairings] = useState<string[]>([]);
  const [newPairing, setNewPairing] = useState('');
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  useEffect(() => {
    if (wine) {
      setFormData({
        name: wine.name,
        producer: wine.producer,
        type: wine.type,
        vintage: wine.vintage?.toString() || '',
        region: wine.region,
        country: wine.country,
        grape: wine.grape,
        alcoholContent: wine.alcoholContent.toString(),
        price: wine.price.toString(),
        glassPrice: wine.glassPrice?.toString() || '',
        tastingNotes: wine.tastingNotes,
        quantity: wine.quantity.toString(),
        imageUrl: wine.imageUrl || '',
      });
      setFoodPairings(wine.foodPairings);
      setFeatured(wine.featured);
      setInStock(wine.inStock);
    }
  }, [wine]);

  if (!wine) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Wine not found</Text>
      </View>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPairing = () => {
    if (newPairing.trim()) {
      setFoodPairings(prev => [...prev, newPairing.trim()]);
      setNewPairing('');
    }
  };

  const handleRemovePairing = (index: number) => {
    setFoodPairings(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateTastingNotes = async () => {
    if (!formData.name && !formData.grape && !formData.type) {
      Alert.alert('Missing Info', 'Please add wine name, grape variety, or type first.');
      return;
    }

    setIsGeneratingNotes(true);
    try {
      const prompt = `Write a brief, elegant tasting note (2-3 sentences) for this wine:
- Name: ${formData.name || 'Unknown'}
- Type: ${formData.type}
- Grape: ${formData.grape || 'Unknown'}
- Region: ${formData.region || 'Unknown'}, ${formData.country || 'Unknown'}
- Vintage: ${formData.vintage || 'NV'}
- Alcohol: ${formData.alcoholContent || 'Unknown'}%

Describe the aroma, palate, and finish in a sophisticated sommelier style. Be specific about flavors and textures.`;

      const result = await generateText(prompt);
      handleChange('tastingNotes', result);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Error generating tasting notes:', error);
      Alert.alert('Error', 'Failed to generate tasting notes. Please try again.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Wine name is required');
      return;
    }
    if (!formData.producer.trim()) {
      Alert.alert('Error', 'Producer is required');
      return;
    }
    if (!formData.price.trim()) {
      Alert.alert('Error', 'Price is required');
      return;
    }

    try {
      await updateWine({
        id: wine.id,
        updates: {
          name: formData.name.trim(),
          producer: formData.producer.trim(),
          type: formData.type,
          vintage: formData.vintage ? parseInt(formData.vintage, 10) : null,
          region: formData.region.trim(),
          country: formData.country.trim(),
          grape: formData.grape.trim(),
          alcoholContent: parseFloat(formData.alcoholContent) || 0,
          price: parseFloat(formData.price) || 0,
          glassPrice: formData.glassPrice ? parseFloat(formData.glassPrice) : null,
          tastingNotes: formData.tastingNotes.trim(),
          foodPairings,
          inStock,
          quantity: parseInt(formData.quantity, 10) || 0,
          imageUrl: formData.imageUrl.trim() || null,
          featured,
        },
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update wine');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSubmit} style={styles.headerButton}>
              <Check size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wine Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(v) => handleChange('name', v)}
                  placeholder="e.g., Château Margaux"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Producer *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.producer}
                  onChangeText={(v) => handleChange('producer', v)}
                  placeholder="e.g., Château Margaux"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wine Type</Text>
                <View style={styles.typeSelector}>
                  {wineTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeChip,
                        formData.type === type.value && styles.typeChipSelected,
                      ]}
                      onPress={() => handleChange('type', type.value)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          formData.type === type.value && styles.typeChipTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Vintage</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.vintage}
                    onChangeText={(v) => handleChange('vintage', v)}
                    placeholder="2020"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Alcohol %</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.alcoholContent}
                    onChangeText={(v) => handleChange('alcoholContent', v)}
                    placeholder="13.5"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Origin</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Region</Text>
                <TextInput
                  style={styles.input}
                  value={formData.region}
                  onChangeText={(v) => handleChange('region', v)}
                  placeholder="e.g., Bordeaux, Napa Valley"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(v) => handleChange('country', v)}
                  placeholder="e.g., France, USA"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Grape Variety</Text>
                <TextInput
                  style={styles.input}
                  value={formData.grape}
                  onChangeText={(v) => handleChange('grape', v)}
                  placeholder="e.g., Cabernet Sauvignon"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
            <View style={styles.formCard}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Bottle Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(v) => handleChange('price', v)}
                    placeholder="45.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Glass Price</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.glassPrice}
                    onChangeText={(v) => handleChange('glassPrice', v)}
                    placeholder="15.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity in Stock</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(v) => handleChange('quantity', v)}
                  placeholder="12"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.featuredToggle}
                onPress={() => setInStock(!inStock)}
              >
                <View style={[styles.checkbox, inStock && styles.checkboxChecked]}>
                  {inStock && <Check size={14} color={Colors.white} />}
                </View>
                <Text style={styles.featuredLabel}>In Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.featuredToggle}
                onPress={() => setFeatured(!featured)}
              >
                <View style={[styles.checkbox, featured && styles.checkboxChecked]}>
                  {featured && <Check size={14} color={Colors.white} />}
                </View>
                <Text style={styles.featuredLabel}>Feature this wine on menu</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasting Notes</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.tastingNotes}
                  onChangeText={(v) => handleChange('tastingNotes', v)}
                  placeholder="Describe the wine's aroma, taste, and finish..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                style={[styles.generateButton, isGeneratingNotes && styles.generateButtonDisabled]}
                onPress={handleGenerateTastingNotes}
                disabled={isGeneratingNotes}
              >
                <Sparkles size={18} color={isGeneratingNotes ? Colors.textMuted : Colors.primary} />
                <Text style={[styles.generateButtonText, isGeneratingNotes && styles.generateButtonTextDisabled]}>
                  {isGeneratingNotes ? 'Generating...' : 'Generate with AI'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Pairings</Text>
            <View style={styles.formCard}>
              <View style={styles.pairingInput}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={newPairing}
                  onChangeText={setNewPairing}
                  placeholder="Add a food pairing"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleAddPairing}
                />
                <TouchableOpacity style={styles.addPairingButton} onPress={handleAddPairing}>
                  <Plus size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
              {foodPairings.length > 0 && (
                <View style={styles.pairingsContainer}>
                  {foodPairings.map((pairing, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.pairingChip}
                      onPress={() => handleRemovePairing(index)}
                    >
                      <Text style={styles.pairingText}>{pairing}</Text>
                      <X size={14} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Image</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.imageUrl}
                  onChangeText={(v) => handleChange('imageUrl', v)}
                  placeholder="https://example.com/wine.jpg"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  typeChipTextSelected: {
    color: Colors.white,
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  featuredLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  pairingInput: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  addPairingButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pairingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  pairingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '12',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  generateButtonDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  generateButtonTextDisabled: {
    color: Colors.textMuted,
  },
  bottomPadding: {
    height: 40,
  },
});
