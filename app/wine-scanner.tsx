import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { generateObject } from '@/services/ai-toolkit';
import {
  Camera,
  ImageIcon,
  X,
  Scan,
  Wine,
  Check,
  RefreshCw,
  Sparkles,
  Plus,
  ScanBarcode,
  Tag,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { WineType, FlavorProfile } from '@/types';
import Button from '@/components/Button';

const WineLabelSchema = z.object({
  name: z.string().describe('Name of the wine'),
  producer: z.string().describe('Producer/winery name'),
  type: z.enum(['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified']).describe('Type of wine based on color and style'),
  vintage: z.number().nullable().describe('Vintage year or null if not visible'),
  region: z.string().describe('Wine region'),
  country: z.string().describe('Country of origin'),
  grape: z.string().describe('Grape variety or blend'),
  alcoholContent: z.number().nullable().describe('Alcohol percentage or null if not visible'),
  tastingNotes: z.string().describe('Brief tasting notes based on the wine type, region, and grape'),
  foodPairings: z.array(z.string()).describe('Suggested food pairings'),
  estimatedPrice: z.number().nullable().describe('Estimated retail price in USD or null if unknown'),
});

type ExtractedWineData = z.infer<typeof WineLabelSchema>;

type ScanMode = 'label' | 'barcode';

export default function WineScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addWine, isAddingWine } = useWines();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<ScanMode>('label');
  const [showCamera, setShowCamera] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedWineData | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  
  const [editedData, setEditedData] = useState<ExtractedWineData | null>(null);
  const [price, setPrice] = useState('');
  const [glassPrice, setGlassPrice] = useState('');
  const [quantity, setQuantity] = useState('12');

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
                text: `Analyze this wine bottle label image and extract the following information:
- Wine name (the main name on the label)
- Producer/winery name
- Type (red, white, rose, sparkling, dessert, or fortified) - determine based on visual cues and wine name
- Vintage year (if visible)
- Region and country of origin
- Grape variety (if mentioned, otherwise make an educated guess based on region)
- Alcohol content percentage (if visible)
- Generate brief tasting notes based on the wine type, region, and grape
- Suggest 3-4 food pairings
- Estimate retail price based on the wine quality indicators

Be as accurate as possible. If information isn't clearly visible, make educated guesses based on wine knowledge.`,
              },
            ],
          },
        ],
        schema: WineLabelSchema,
      });
      return result;
    },
    onSuccess: (data) => {
      console.log('Extracted wine data:', data);
      setExtractedData(data);
      setEditedData(data);
      if (data.estimatedPrice) {
        setPrice(data.estimatedPrice.toString());
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      console.error('Extraction error:', error);
      Alert.alert('Error', 'Failed to analyze wine label. Please try again with a clearer image.');
    },
  });

  const barcodeLookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `I scanned a wine bottle barcode: ${barcode}

Based on this barcode/UPC, provide wine information. If you can identify the specific wine, provide accurate details. If not, make reasonable assumptions for a typical wine that might have this barcode format.

Provide:
- Wine name
- Producer
- Type (red, white, rose, sparkling, dessert, fortified)
- Vintage (if known, otherwise null)
- Region and country
- Grape variety
- Alcohol content (if known)
- Tasting notes
- Food pairings
- Estimated price`,
          },
        ],
        schema: WineLabelSchema,
      });
      return result;
    },
    onSuccess: (data) => {
      console.log('Barcode lookup result:', data);
      setExtractedData(data);
      setEditedData(data);
      if (data.estimatedPrice) {
        setPrice(data.estimatedPrice.toString());
      }
      setIsProcessingBarcode(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      console.error('Barcode lookup error:', error);
      setIsProcessingBarcode(false);
      Alert.alert('Error', 'Failed to look up wine from barcode. Please try scanning the label instead.');
    },
  });

  const handleAddWine = async () => {
    if (!editedData) return;

    const defaultFlavorProfile: FlavorProfile = {
      body: 3,
      sweetness: editedData.type === 'dessert' ? 4 : 2,
      tannins: editedData.type === 'red' ? 3 : 1,
      acidity: 3,
    };

    try {
      await addWine({
        name: editedData.name,
        producer: editedData.producer,
        type: editedData.type as WineType,
        vintage: editedData.vintage,
        region: editedData.region,
        country: editedData.country,
        grape: editedData.grape,
        alcoholContent: editedData.alcoholContent || 13.5,
        price: parseFloat(price) || editedData.estimatedPrice || 0,
        glassPrice: glassPrice ? parseFloat(glassPrice) : null,
        tastingNotes: editedData.tastingNotes,
        foodPairings: editedData.foodPairings,
        inStock: true,
        quantity: parseInt(quantity, 10) || 12,
        imageUrl: null,
        featured: false,
        flavorProfile: defaultFlavorProfile,
        dietaryTags: [],
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Wine Added!',
        `${editedData.name} has been added to your catalog.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error adding wine:', error);
      Alert.alert('Error', 'Failed to add wine. Please try again.');
    }
  };

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
        setExtractedData(null);
        setEditedData(null);
        setScannedBarcode(null);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isProcessingBarcode) return;
    
    console.log('Barcode scanned:', result.data);
    setScannedBarcode(result.data);
    setIsProcessingBarcode(true);
    setShowCamera(false);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    barcodeLookupMutation.mutate(result.data);
  };

  const handleExtract = () => {
    if (!imageBase64) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }
    extractMutation.mutate(imageBase64);
  };

  const handleReset = () => {
    setImageUri(null);
    setImageBase64(null);
    setExtractedData(null);
    setEditedData(null);
    setScannedBarcode(null);
    setPrice('');
    setGlassPrice('');
    setQuantity('12');
    setShowCamera(false);
  };

  const updateEditedData = (field: keyof ExtractedWineData, value: string | number | null) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: value });
    }
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

  if (showCamera && scanMode === 'barcode') {
    if (!permission) {
      return (
        <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowCamera(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Barcode Scanner</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={[styles.centered, { flex: 1 }]}>
            <Text style={styles.permissionText}>Camera permission is required to scan barcodes</Text>
            <Button title="Grant Permission" onPress={requestPermission} />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowCamera(false)}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.topLeft]} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanHint}>Position barcode within the frame</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wine Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!imageUri && !scannedBarcode && !extractedData ? (
            <View style={styles.uploadSection}>
              <View style={styles.uploadIcon}>
                <Wine size={48} color={Colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Scan Wine Label</Text>
              <Text style={styles.uploadDescription}>
                Take a photo of a wine label or scan the barcode. Our AI will extract wine details automatically.
              </Text>

              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeButton, scanMode === 'label' && styles.modeButtonActive]}
                  onPress={() => setScanMode('label')}
                >
                  <Tag size={20} color={scanMode === 'label' ? Colors.white : Colors.primary} />
                  <Text style={[styles.modeButtonText, scanMode === 'label' && styles.modeButtonTextActive]}>
                    Label
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
                  onPress={() => setScanMode('barcode')}
                >
                  <ScanBarcode size={20} color={scanMode === 'barcode' ? Colors.white : Colors.primary} />
                  <Text style={[styles.modeButtonText, scanMode === 'barcode' && styles.modeButtonTextActive]}>
                    Barcode
                  </Text>
                </TouchableOpacity>
              </View>

              {scanMode === 'label' ? (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(true)}>
                    <View style={styles.uploadButtonIcon}>
                      <Camera size={28} color={Colors.white} />
                    </View>
                    <Text style={styles.uploadButtonTitle}>Take Photo</Text>
                    <Text style={styles.uploadButtonSubtitle}>Use camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(false)}>
                    <View style={[styles.uploadButtonIcon, { backgroundColor: Colors.secondary }]}>
                      <ImageIcon size={28} color={Colors.white} />
                    </View>
                    <Text style={styles.uploadButtonTitle}>Upload</Text>
                    <Text style={styles.uploadButtonSubtitle}>From gallery</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.scanBarcodeButton}
                  onPress={() => setShowCamera(true)}
                >
                  <ScanBarcode size={32} color={Colors.white} />
                  <Text style={styles.scanBarcodeText}>Open Barcode Scanner</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {imageUri && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
                  <TouchableOpacity style={styles.changeImageButton} onPress={handleReset}>
                    <X size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              )}

              {scannedBarcode && !extractedData && (
                <View style={styles.barcodeResult}>
                  <ScanBarcode size={24} color={Colors.primary} />
                  <Text style={styles.barcodeText}>Barcode: {scannedBarcode}</Text>
                  {barcodeLookupMutation.isPending && (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  )}
                </View>
              )}

              {!extractedData && imageUri && (
                <View style={styles.extractSection}>
                  <Button
                    title={extractMutation.isPending ? 'Analyzing Label...' : 'Extract Wine Info'}
                    onPress={handleExtract}
                    icon={Sparkles}
                    loading={extractMutation.isPending}
                    fullWidth
                  />
                  {extractMutation.isPending && (
                    <Text style={styles.extractingText}>
                      AI is analyzing the wine label...
                    </Text>
                  )}
                </View>
              )}

              {editedData && (
                <View style={styles.resultsSection}>
                  <View style={styles.resultsHeader}>
                    <View style={styles.wineTypeIndicator}>
                      <View style={[styles.typeCircle, { backgroundColor: getTypeColor(editedData.type) }]} />
                      <Text style={styles.typeLabel}>
                        {editedData.type.charAt(0).toUpperCase() + editedData.type.slice(1)} Wine
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                      <RefreshCw size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Wine Name *</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData.name}
                        onChangeText={(v) => updateEditedData('name', v)}
                        placeholder="Wine name"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Producer *</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData.producer}
                        onChangeText={(v) => updateEditedData('producer', v)}
                        placeholder="Producer/Winery"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.label}>Vintage</Text>
                        <TextInput
                          style={styles.input}
                          value={editedData.vintage?.toString() || ''}
                          onChangeText={(v) => updateEditedData('vintage', v ? parseInt(v, 10) : null)}
                          placeholder="Year"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.label}>Alcohol %</Text>
                        <TextInput
                          style={styles.input}
                          value={editedData.alcoholContent?.toString() || ''}
                          onChangeText={(v) => updateEditedData('alcoholContent', v ? parseFloat(v) : null)}
                          placeholder="13.5"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Region</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData.region}
                        onChangeText={(v) => updateEditedData('region', v)}
                        placeholder="Wine region"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Country</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData.country}
                        onChangeText={(v) => updateEditedData('country', v)}
                        placeholder="Country"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Grape Variety</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData.grape}
                        onChangeText={(v) => updateEditedData('grape', v)}
                        placeholder="Grape variety"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Pricing & Inventory</Text>
                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.label}>Bottle Price *</Text>
                        <TextInput
                          style={styles.input}
                          value={price}
                          onChangeText={setPrice}
                          placeholder="45.00"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.label}>Glass Price</Text>
                        <TextInput
                          style={styles.input}
                          value={glassPrice}
                          onChangeText={setGlassPrice}
                          placeholder="15.00"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Quantity</Text>
                      <TextInput
                        style={styles.input}
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="12"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Tasting Notes</Text>
                    <Text style={styles.tastingNotes}>{editedData.tastingNotes}</Text>
                  </View>

                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Food Pairings</Text>
                    <View style={styles.pairingsContainer}>
                      {editedData.foodPairings.map((pairing, index) => (
                        <View key={index} style={styles.pairingChip}>
                          <Text style={styles.pairingText}>{pairing}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.submitSection}>
                    <Button
                      title="Add to Catalog"
                      onPress={handleAddWine}
                      icon={Plus}
                      loading={isAddingWine}
                      fullWidth
                      size="large"
                    />
                  </View>

                  <TouchableOpacity style={styles.scanAnotherButton} onPress={handleReset}>
                    <Camera size={18} color={Colors.primary} />
                    <Text style={styles.scanAnotherText}>Scan Another Wine</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 20,
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
    marginBottom: 24,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  modeButtonTextActive: {
    color: Colors.white,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
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
  scanBarcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    width: '100%',
  },
  scanBarcodeText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanHint: {
    color: Colors.white,
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
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
  barcodeResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  barcodeText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
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
    gap: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wineTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  tastingNotes: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  pairingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pairingChip: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pairingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  submitSection: {
    marginTop: 8,
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  scanAnotherText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  bottomPadding: {
    height: 40,
  },
});
