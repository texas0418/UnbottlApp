import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  ImageIcon,
  X,
  Scan,
  Wine,
  Coffee,
  Check,
  AlertCircle,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { z } from 'zod';
import { generateObject } from '@/services/ai-toolkit';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { WineType, FlavorProfile } from '@/types';
import Button from '@/components/Button';

const MenuItemSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('Name of the wine or beverage'),
      producer: z.string().describe('Producer/winery name, or "Unknown" if not specified'),
      type: z.enum(['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified']).describe('Type of wine'),
      vintage: z.number().nullable().describe('Vintage year or null if not specified'),
      region: z.string().describe('Wine region, or "Unknown" if not specified'),
      country: z.string().describe('Country of origin, or "Unknown" if not specified'),
      grape: z.string().describe('Grape variety, or "Blend" if not specified'),
      price: z.number().describe('Price per bottle in dollars'),
      glassPrice: z.number().nullable().describe('Price per glass or null if not available'),
      tastingNotes: z.string().describe('Brief tasting notes or description'),
      foodPairings: z.array(z.string()).describe('Suggested food pairings'),
    })
  ),
});

type ExtractedItem = z.infer<typeof MenuItemSchema>['items'][number];

export default function MenuScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addWine } = useWines();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const extractMutation = useMutation({
    mutationFn: async (base64: string) => {
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: base64,
              },
              {
                type: 'text',
                text: `Analyze this menu image and extract all wine and beverage items. For each item, extract:
- Name of the wine/beverage
- Producer or winery (use "Unknown" if not visible)
- Type (red, white, rose, sparkling, dessert, or fortified)
- Vintage year (null if not shown)
- Region and country
- Grape variety
- Price (bottle price, estimate if not clear)
- Glass price (if available)
- Brief tasting notes based on the wine type and region
- Suggested food pairings

Extract ALL items you can find. If prices aren't clear, make reasonable estimates based on the wine type and region.`,
              },
            ],
          },
        ],
        schema: MenuItemSchema,
      });
      return result;
    },
    onSuccess: (data) => {
      console.log('Extracted items:', data.items);
      setExtractedItems(data.items);
      setSelectedItems(new Set(data.items.map((_, i) => i)));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      console.error('Extraction error:', error);
      Alert.alert('Error', 'Failed to extract menu items. Please try again with a clearer image.');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (items: ExtractedItem[]) => {
      const defaultFlavorProfile: FlavorProfile = {
        body: 3,
        sweetness: 2,
        tannins: 3,
        acidity: 3,
      };

      for (const item of items) {
        await addWine({
          name: item.name,
          producer: item.producer,
          type: item.type as WineType,
          vintage: item.vintage,
          region: item.region,
          country: item.country,
          grape: item.grape,
          alcoholContent: 13.5,
          price: item.price,
          glassPrice: item.glassPrice,
          tastingNotes: item.tastingNotes,
          foodPairings: item.foodPairings,
          inStock: true,
          quantity: 12,
          imageUrl: null,
          featured: false,
          flavorProfile: defaultFlavorProfile,
          dietaryTags: [],
        });
      }
    },
    onSuccess: () => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Success!',
        `${selectedItems.size} items have been added to your catalog.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error) => {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import some items. Please try again.');
    },
  });

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: true,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setExtractedItems([]);
        setSelectedItems(new Set());
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleExtract = () => {
    if (!imageBase64) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }
    extractMutation.mutate(imageBase64);
  };

  const handleImport = () => {
    const itemsToImport = extractedItems.filter((_, i) => selectedItems.has(i));
    if (itemsToImport.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to import.');
      return;
    }
    importMutation.mutate(itemsToImport);
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const selectAll = () => {
    setSelectedItems(new Set(extractedItems.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const removeItem = (index: number) => {
    setExtractedItems(items => items.filter((_, i) => i !== index));
    setSelectedItems(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'red': return '#8B2635';
      case 'white': return '#E8D5B7';
      case 'rose': return '#F4B8C5';
      case 'sparkling': return '#FFD700';
      case 'dessert': return '#DAA520';
      case 'fortified': return '#722F37';
      default: return Colors.primary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!imageUri ? (
          <View style={styles.uploadSection}>
            <View style={styles.uploadIcon}>
              <Scan size={48} color={Colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Scan Your Menu</Text>
            <Text style={styles.uploadDescription}>
              Take a photo or upload an image of your wine menu. Our AI will automatically extract all items and add them to your catalog.
            </Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage(true)}
              >
                <View style={styles.uploadButtonIcon}>
                  <Camera size={28} color={Colors.white} />
                </View>
                <Text style={styles.uploadButtonTitle}>Take Photo</Text>
                <Text style={styles.uploadButtonSubtitle}>Use camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage(false)}
              >
                <View style={[styles.uploadButtonIcon, { backgroundColor: Colors.secondary }]}>
                  <ImageIcon size={28} color={Colors.white} />
                </View>
                <Text style={styles.uploadButtonTitle}>Upload Image</Text>
                <Text style={styles.uploadButtonSubtitle}>From gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                  setExtractedItems([]);
                }}
              >
                <X size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {extractedItems.length === 0 ? (
              <View style={styles.extractSection}>
                <Button
                  title={extractMutation.isPending ? 'Analyzing Menu...' : 'Extract Menu Items'}
                  onPress={handleExtract}
                  icon={Scan}
                  loading={extractMutation.isPending}
                  fullWidth
                />
                {extractMutation.isPending && (
                  <Text style={styles.extractingText}>
                    AI is analyzing your menu. This may take a moment...
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.resultsSection}>
                <View style={styles.resultsHeader}>
                  <View>
                    <Text style={styles.resultsTitle}>
                      {extractedItems.length} Items Found
                    </Text>
                    <Text style={styles.resultsSubtitle}>
                      {selectedItems.size} selected for import
                    </Text>
                  </View>
                  <View style={styles.selectButtons}>
                    <TouchableOpacity onPress={selectAll} style={styles.selectButton}>
                      <Text style={styles.selectButtonText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deselectAll} style={styles.selectButton}>
                      <Text style={styles.selectButtonText}>None</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {extractedItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.itemCard,
                      selectedItems.has(index) && styles.itemCardSelected,
                    ]}
                    onPress={() => toggleItem(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemCheckbox}>
                      {selectedItems.has(index) ? (
                        <View style={styles.checkboxChecked}>
                          <Check size={14} color={Colors.white} />
                        </View>
                      ) : (
                        <View style={styles.checkboxUnchecked} />
                      )}
                    </View>
                    
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <View
                          style={[
                            styles.typeIndicator,
                            { backgroundColor: getTypeColor(item.type) },
                          ]}
                        />
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={styles.itemProducer} numberOfLines={1}>
                        {item.producer} • {item.region}
                      </Text>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemType}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          {item.vintage ? ` • ${item.vintage}` : ''}
                        </Text>
                        <Text style={styles.itemPrice}>
                          ${item.price}
                          {item.glassPrice ? ` / $${item.glassPrice} glass` : ''}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(index)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                <View style={styles.importSection}>
                  <Button
                    title={`Import ${selectedItems.size} Items`}
                    onPress={handleImport}
                    icon={Plus}
                    loading={importMutation.isPending}
                    disabled={selectedItems.size === 0}
                    fullWidth
                  />
                </View>

                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => {
                    setImageUri(null);
                    setImageBase64(null);
                    setExtractedItems([]);
                  }}
                >
                  <Camera size={18} color={Colors.primary} />
                  <Text style={styles.rescanText}>Scan Another Menu</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  uploadIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  uploadDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  uploadButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extractSection: {
    gap: 16,
  },
  extractingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resultsSection: {
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  itemCheckbox: {
    marginRight: 12,
  },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  itemProducer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  importSection: {
    marginTop: 8,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  rescanText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
});
