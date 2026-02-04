import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Check,
  X,
  ChevronLeft,
  Wine,
  Beer,
  GlassWater,
  Martini,
  Coffee,
  Edit3,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { analyzeMenuImage, ExtractedBeverage } from '@/services/menu-ai';

type ImportStep = 'capture' | 'processing' | 'review' | 'importing' | 'complete';

export default function MenuImportScreen() {
  const router = useRouter();
  const { addWine } = useWines();
  const { addBeverage } = useBeverages();

  const [step, setStep] = useState<ImportStep>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedBeverage[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to scan menus.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      processImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      processImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const processImage = async (uri: string, base64?: string | null) => {
    setStep('processing');
    try {
      const items = await analyzeMenuImage(uri, base64 || undefined);
      setExtractedItems(items);
      // Select all items by default
      setSelectedItems(new Set(items.map(item => item.id)));
      setStep('review');
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze menu. Please try again.');
      setStep('capture');
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(extractedItems.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const updateItem = (id: string, updates: Partial<ExtractedBeverage>) => {
    setExtractedItems(items =>
      items.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id: string) => {
    setExtractedItems(items => items.filter(item => item.id !== id));
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  const importItems = async () => {
    const itemsToImport = extractedItems.filter(item => selectedItems.has(item.id));
    if (itemsToImport.length === 0) {
      Alert.alert('No items selected', 'Please select at least one item to import.');
      return;
    }

    setStep('importing');

    for (let i = 0; i < itemsToImport.length; i++) {
      const item = itemsToImport[i];
      setImportProgress(((i + 1) / itemsToImport.length) * 100);

      try {
        if (item.category === 'wine') {
          await addWine({
            name: item.name,
            producer: item.producer || 'Unknown',
            type: item.wineType || 'red',
            grape: item.grape || '',
            region: item.region || '',
            country: item.country || '',
            vintage: item.vintage,
            price: item.price,
            description: item.description || '',
            tastingNotes: item.tastingNotes || '',
            pairings: item.pairings || [],
            inStock: true,
            quantity: item.quantity || 1,
          });
        } else {
          await addBeverage({
            name: item.name,
            category: item.category,
            type: item.beverageType || '',
            producer: item.producer || '',
            description: item.description || '',
            price: item.price,
            inStock: true,
            quantity: item.quantity || 1,
          });
        }
      } catch (error) {
        console.error('Error importing item:', item.name, error);
      }

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setStep('complete');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wine':
        return <Wine size={20} color={Colors.primary} />;
      case 'beer':
        return <Beer size={20} color="#C67A3C" />;
      case 'spirit':
        return <GlassWater size={20} color="#A0522D" />;
      case 'cocktail':
        return <Martini size={20} color="#E91E63" />;
      case 'non-alcoholic':
        return <Coffee size={20} color="#4CAF50" />;
      default:
        return <GlassWater size={20} color={Colors.textSecondary} />;
    }
  };

  const renderCaptureStep = () => (
    <ScrollView 
      style={styles.captureContainer}
      contentContainerStyle={styles.captureContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.captureHeader}>
        <View style={styles.iconContainer}>
          <Sparkles size={48} color={Colors.primary} />
        </View>
        <Text style={styles.captureTitle}>AI Menu Import</Text>
        <Text style={styles.captureSubtitle}>
          Take a photo of your menu and let AI automatically extract all beverages
        </Text>
      </View>

      <View style={styles.captureButtons}>
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonIcon}>
            <Camera size={32} color={Colors.white} />
          </View>
          <Text style={styles.captureButtonTitle}>Take Photo</Text>
          <Text style={styles.captureButtonSubtitle}>Use camera to capture menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButtonSecondary} onPress={pickImage}>
          <View style={[styles.captureButtonIcon, styles.captureButtonIconSecondary]}>
            <ImageIcon size={32} color={Colors.primary} />
          </View>
          <Text style={styles.captureButtonTitleSecondary}>Choose Photo</Text>
          <Text style={styles.captureButtonSubtitle}>Select from photo library</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for best results:</Text>
        <Text style={styles.tipText}>• Ensure good lighting</Text>
        <Text style={styles.tipText}>• Keep the menu flat and in focus</Text>
        <Text style={styles.tipText}>• Capture one page at a time</Text>
        <Text style={styles.tipText}>• Include prices if visible</Text>
      </View>
    </ScrollView>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.processingImage} />
      )}
      <View style={styles.processingOverlay}>
        <ActivityIndicator size="large" color={Colors.white} />
        <Text style={styles.processingText}>Analyzing menu...</Text>
        <Text style={styles.processingSubtext}>
          AI is extracting beverages from your menu
        </Text>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.reviewContainer}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTitle}>
          Found {extractedItems.length} beverages
        </Text>
        <Text style={styles.reviewSubtitle}>
          {selectedItems.size} selected for import
        </Text>
        <View style={styles.selectionButtons}>
          <TouchableOpacity style={styles.selectionButton} onPress={selectAll}>
            <Text style={styles.selectionButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionButton} onPress={deselectAll}>
            <Text style={styles.selectionButtonText}>Deselect All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {extractedItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <TouchableOpacity
              style={[
                styles.itemCheckbox,
                selectedItems.has(item.id) && styles.itemCheckboxSelected,
              ]}
              onPress={() => toggleItemSelection(item.id)}
            >
              {selectedItems.has(item.id) && (
                <Check size={16} color={Colors.white} />
              )}
            </TouchableOpacity>

            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                {getCategoryIcon(item.category)}
                <Text style={styles.itemCategory}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
                {item.confidence && (
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round(item.confidence * 100)}% match
                    </Text>
                  </View>
                )}
              </View>

              {editingItem === item.id ? (
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.editInput}
                    value={item.name}
                    onChangeText={(text) => updateItem(item.id, { name: text })}
                    placeholder="Name"
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.editInput, styles.editInputHalf]}
                      value={item.producer || ''}
                      onChangeText={(text) => updateItem(item.id, { producer: text })}
                      placeholder="Producer"
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.editInput, styles.editInputHalf]}
                      value={item.price?.toString() || ''}
                      onChangeText={(text) => updateItem(item.id, { price: parseFloat(text) || 0 })}
                      placeholder="Price"
                      keyboardType="decimal-pad"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.editDoneButton}
                    onPress={() => setEditingItem(null)}
                  >
                    <Text style={styles.editDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.producer && (
                    <Text style={styles.itemProducer}>{item.producer}</Text>
                  )}
                  {item.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.itemFooter}>
                    {item.price !== undefined && item.price > 0 && (
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    )}
                    {item.vintage && (
                      <Text style={styles.itemVintage}>{item.vintage}</Text>
                    )}
                  </View>
                </>
              )}
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.itemActionButton}
                onPress={() => setEditingItem(editingItem === item.id ? null : item.id)}
              >
                <Edit3 size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.itemActionButton}
                onPress={() => deleteItem(item.id)}
              >
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.reviewFooter}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => {
            setStep('capture');
            setExtractedItems([]);
            setImageUri(null);
          }}
        >
          <Camera size={20} color={Colors.primary} />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.importButton,
            selectedItems.size === 0 && styles.importButtonDisabled,
          ]}
          onPress={importItems}
          disabled={selectedItems.size === 0}
        >
          <Upload size={20} color={Colors.white} />
          <Text style={styles.importButtonText}>
            Import {selectedItems.size} Items
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImportingStep = () => (
    <View style={styles.importingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.importingTitle}>Importing beverages...</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${importProgress}%` }]} />
      </View>
      <Text style={styles.importingProgress}>
        {Math.round(importProgress)}% complete
      </Text>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.completeContainer}>
      <View style={styles.completeIcon}>
        <Check size={48} color={Colors.white} />
      </View>
      <Text style={styles.completeTitle}>Import Complete!</Text>
      <Text style={styles.completeSubtitle}>
        {selectedItems.size} beverages have been added to your inventory
      </Text>
      <View style={styles.completeButtons}>
        <TouchableOpacity
          style={styles.completeButtonSecondary}
          onPress={() => {
            setStep('capture');
            setExtractedItems([]);
            setSelectedItems(new Set());
            setImageUri(null);
          }}
        >
          <Camera size={20} color={Colors.primary} />
          <Text style={styles.completeButtonSecondaryText}>Scan Another</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => router.push('/(tabs)/catalog')}
        >
          <Text style={styles.completeButtonText}>View Catalog</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Menu</Text>
        <View style={styles.headerSpacer} />
      </View>

      {step === 'capture' && renderCaptureStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'importing' && renderImportingStep()}
      {step === 'complete' && renderCompleteStep()}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  captureContainer: {
    flex: 1,
  },
  captureContentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  captureHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  captureSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  captureButtons: {
    gap: 16,
    marginBottom: 32,
  },
  captureButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  captureButtonSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  captureButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  captureButtonIconSecondary: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  captureButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  captureButtonTitleSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  captureButtonSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tipsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  processingContainer: {
    flex: 1,
    position: 'relative',
  },
  processingImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  reviewContainer: {
    flex: 1,
  },
  reviewHeader: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  selectionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  selectionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4CAF50',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  itemProducer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemVintage: {
    fontSize: 13,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemActions: {
    justifyContent: 'center',
    gap: 8,
  },
  itemActionButton: {
    padding: 8,
  },
  editForm: {
    gap: 8,
  },
  editInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editInputHalf: {
    flex: 1,
  },
  editDoneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  editDoneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  reviewFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  importingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  importingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  importingProgress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  completeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  completeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  completeButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completeButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
