import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { X, Check, Wine, Sparkles, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { WineType, FlavorProfile } from '@/types';
import { CustomerPreferences, useRecommendations } from '@/contexts/RecommendationsContext';

const WINE_TYPES: { type: WineType; label: string; color: string }[] = [
  { type: 'red', label: 'Red', color: '#722F37' },
  { type: 'white', label: 'White', color: '#F5E6C8' },
  { type: 'rose', label: 'Rosé', color: '#E8B4B8' },
  { type: 'sparkling', label: 'Sparkling', color: '#F7E7CE' },
  { type: 'dessert', label: 'Dessert', color: '#D4A574' },
  { type: 'fortified', label: 'Fortified', color: '#8B4513' },
];

const PRICE_RANGES = [
  { label: 'Budget Friendly', min: 0, max: 50, icon: '💰' },
  { label: 'Mid-Range', min: 25, max: 150, icon: '✨' },
  { label: 'Premium', min: 100, max: 500, icon: '🍷' },
  { label: 'Luxury', min: 200, max: 10000, icon: '👑' },
];

const OCCASIONS = [
  'Dinner Party',
  'Casual Evening',
  'Celebration',
  'Romantic Date',
  'Business Dinner',
  'Summer BBQ',
];

interface PreferencesSetupProps {
  visible: boolean;
  onClose: () => void;
  initialPreferences?: CustomerPreferences;
}

export default function PreferencesSetup({ 
  visible, 
  onClose, 
  initialPreferences 
}: PreferencesSetupProps) {
  const { savePreferences, isSaving } = useRecommendations();
  const [step, setStep] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<WineType[]>(
    initialPreferences?.preferredTypes || []
  );
  const [priceRange, setPriceRange] = useState(
    initialPreferences?.priceRange || { min: 0, max: 500 }
  );
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>(
    initialPreferences?.flavorProfile || { body: 3, sweetness: 2, tannins: 3, acidity: 3 }
  );
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    initialPreferences?.occasions || []
  );
  const [avoidHighTannins, setAvoidHighTannins] = useState(
    initialPreferences?.avoidHighTannins || false
  );

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleType = useCallback((type: WineType) => {
    triggerHaptic();
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, [triggerHaptic]);

  const toggleOccasion = useCallback((occasion: string) => {
    triggerHaptic();
    setSelectedOccasions(prev =>
      prev.includes(occasion)
        ? prev.filter(o => o !== occasion)
        : [...prev, occasion]
    );
  }, [triggerHaptic]);

  const selectPriceRange = useCallback((range: { min: number; max: number }) => {
    triggerHaptic();
    setPriceRange(range);
  }, [triggerHaptic]);

  const handleSave = useCallback(async () => {
    const preferences: CustomerPreferences = {
      preferredTypes: selectedTypes,
      priceRange,
      flavorProfile,
      avoidHighTannins,
      preferOrganic: false,
      preferLocal: false,
      occasions: selectedOccasions,
    };
    
    try {
      await savePreferences(preferences);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still close the modal even if save fails - preferences are also stored in memory
    }
    onClose();
  }, [selectedTypes, priceRange, flavorProfile, avoidHighTannins, selectedOccasions, savePreferences, onClose]);

  const renderFlavorSlider = (
    label: string, 
    value: number, 
    key: keyof FlavorProfile,
    leftLabel: string,
    rightLabel: string
  ) => (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            style={[
              styles.sliderDot,
              value >= n && styles.sliderDotActive,
            ]}
            onPress={() => {
              triggerHaptic();
              setFlavorProfile(prev => ({ ...prev, [key]: n }));
            }}
          />
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinMax}>{leftLabel}</Text>
        <Text style={styles.sliderMinMax}>{rightLabel}</Text>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Wine size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>What wines do you enjoy?</Text>
              <Text style={styles.stepSubtitle}>Select all that apply</Text>
            </View>
            <View style={styles.typeGrid}>
              {WINE_TYPES.map(({ type, label, color }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeCard,
                    selectedTypes.includes(type) && styles.typeCardSelected,
                  ]}
                  onPress={() => toggleType(type)}
                >
                  <View style={[styles.typeColor, { backgroundColor: color }]} />
                  <Text style={[
                    styles.typeLabel,
                    selectedTypes.includes(type) && styles.typeLabelSelected,
                  ]}>
                    {label}
                  </Text>
                  {selectedTypes.includes(type) && (
                    <View style={styles.typeCheck}>
                      <Check size={14} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepEmoji}>💵</Text>
              <Text style={styles.stepTitle}>Your price comfort zone</Text>
              <Text style={styles.stepSubtitle}>Per bottle</Text>
            </View>
            <View style={styles.priceGrid}>
              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.label}
                  style={[
                    styles.priceCard,
                    priceRange.min === range.min && priceRange.max === range.max && styles.priceCardSelected,
                  ]}
                  onPress={() => selectPriceRange({ min: range.min, max: range.max })}
                >
                  <Text style={styles.priceEmoji}>{range.icon}</Text>
                  <Text style={[
                    styles.priceLabel,
                    priceRange.min === range.min && priceRange.max === range.max && styles.priceLabelSelected,
                  ]}>
                    {range.label}
                  </Text>
                  <Text style={styles.priceRange}>
                    ${range.min} - ${range.max === 10000 ? '∞' : range.max}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Sparkles size={32} color={Colors.secondary} />
              <Text style={styles.stepTitle}>Flavor preferences</Text>
              <Text style={styles.stepSubtitle}>Adjust to your taste</Text>
            </View>
            <View style={styles.slidersContainer}>
              {renderFlavorSlider('Body', flavorProfile.body, 'body', 'Light', 'Full')}
              {renderFlavorSlider('Sweetness', flavorProfile.sweetness, 'sweetness', 'Dry', 'Sweet')}
              {renderFlavorSlider('Tannins', flavorProfile.tannins, 'tannins', 'Soft', 'Grippy')}
              {renderFlavorSlider('Acidity', flavorProfile.acidity, 'acidity', 'Low', 'High')}
            </View>
            <TouchableOpacity
              style={[styles.toggleOption, avoidHighTannins && styles.toggleOptionActive]}
              onPress={() => {
                triggerHaptic();
                setAvoidHighTannins(!avoidHighTannins);
              }}
            >
              <Text style={styles.toggleLabel}>Avoid high-tannin wines</Text>
              <View style={[styles.toggleSwitch, avoidHighTannins && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, avoidHighTannins && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Heart size={32} color={Colors.error} />
              <Text style={styles.stepTitle}>Common occasions</Text>
              <Text style={styles.stepSubtitle}>When do you enjoy wine?</Text>
            </View>
            <View style={styles.occasionGrid}>
              {OCCASIONS.map((occasion) => (
                <TouchableOpacity
                  key={occasion}
                  style={[
                    styles.occasionChip,
                    selectedOccasions.includes(occasion) && styles.occasionChipSelected,
                  ]}
                  onPress={() => toggleOccasion(occasion)}
                >
                  <Text style={[
                    styles.occasionLabel,
                    selectedOccasions.includes(occasion) && styles.occasionLabelSelected,
                  ]}>
                    {occasion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Preferences</Text>
          <View style={styles.stepIndicator}>
            {[0, 1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[styles.stepDot, step >= i && styles.stepDotActive]} 
              />
            ))}
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                triggerHaptic();
                setStep(step - 1);
              }}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, step === 0 && styles.nextButtonFull]}
            onPress={() => {
              triggerHaptic();
              if (step < 3) {
                setStep(step + 1);
              } else {
                handleSave();
              }
            }}
            disabled={isSaving}
          >
            <Text style={styles.nextButtonText}>
              {step === 3 ? (isSaving ? 'Saving...' : 'Get Recommendations') : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  typeCard: {
    width: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(114, 47, 55, 0.05)',
  },
  typeColor: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeLabelSelected: {
    color: Colors.primary,
  },
  typeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceGrid: {
    gap: 12,
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  priceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(114, 47, 55, 0.05)',
  },
  priceEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  priceLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  priceLabelSelected: {
    color: Colors.primary,
  },
  priceRange: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  slidersContainer: {
    gap: 24,
    marginBottom: 24,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
    backgroundColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sliderDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMinMax: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleOptionActive: {
    borderColor: Colors.primary,
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  occasionChip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  occasionChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
  },
  occasionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  occasionLabelSelected: {
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    gap: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
