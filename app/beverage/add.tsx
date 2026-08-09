import React, { useState } from 'react';
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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { X, Plus, Check, Sparkles, Wine, Beer, GlassWater, Martini, Coffee, Utensils } from 'lucide-react-native';
import { generateText } from '@/services/ai-toolkit';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBeverages } from '@/contexts/BeverageContext';
import { BeverageCategory, WineType, BeerType, SpiritType, CocktailType, NonAlcoholicType } from '@/types';
import Button from '@/components/Button';
import {
  missingFieldsMessage,
  buildWinePayload,
  buildBeerPayload,
  buildSpiritPayload,
  buildCocktailPayload,
  buildNonAlcoholicPayload,
} from '@/utils/beverageFormPayloads';
import { buildDescriptionPrompt, buildPairingsPrompt } from '@/utils/beverageAiPrompts';
import { categoryColors } from '@/mocks/beverages';

const categories: { label: string; value: BeverageCategory; icon: React.ReactNode }[] = [
  { label: 'Wine', value: 'wine', icon: <Wine size={20} color={categoryColors.wine} /> },
  { label: 'Beer', value: 'beer', icon: <Beer size={20} color={categoryColors.beer} /> },
  { label: 'Spirits', value: 'spirit', icon: <GlassWater size={20} color={categoryColors.spirit} /> },
  { label: 'Cocktails', value: 'cocktail', icon: <Martini size={20} color={categoryColors.cocktail} /> },
  { label: 'Non-Alcoholic', value: 'non-alcoholic', icon: <Coffee size={20} color={categoryColors['non-alcoholic']} /> },
];

const wineTypes: { label: string; value: WineType }[] = [
  { label: 'Red', value: 'red' },
  { label: 'White', value: 'white' },
  { label: 'Rosé', value: 'rose' },
  { label: 'Sparkling', value: 'sparkling' },
  { label: 'Dessert', value: 'dessert' },
  { label: 'Fortified', value: 'fortified' },
];

const beerTypes: { label: string; value: BeerType }[] = [
  { label: 'IPA', value: 'ipa' },
  { label: 'Lager', value: 'lager' },
  { label: 'Ale', value: 'ale' },
  { label: 'Stout', value: 'stout' },
  { label: 'Porter', value: 'porter' },
  { label: 'Wheat', value: 'wheat' },
  { label: 'Pilsner', value: 'pilsner' },
  { label: 'Sour', value: 'sour' },
];

const spiritTypes: { label: string; value: SpiritType }[] = [
  { label: 'Whiskey', value: 'whiskey' },
  { label: 'Vodka', value: 'vodka' },
  { label: 'Gin', value: 'gin' },
  { label: 'Rum', value: 'rum' },
  { label: 'Tequila', value: 'tequila' },
  { label: 'Brandy', value: 'brandy' },
  { label: 'Mezcal', value: 'mezcal' },
  { label: 'Liqueur', value: 'liqueur' },
];

const cocktailTypes: { label: string; value: CocktailType }[] = [
  { label: 'Signature', value: 'signature' },
  { label: 'Classic', value: 'classic' },
  { label: 'Seasonal', value: 'seasonal' },
  { label: 'Mocktail', value: 'mocktail' },
];

const nonAlcTypes: { label: string; value: NonAlcoholicType }[] = [
  { label: 'Coffee', value: 'coffee' },
  { label: 'Tea', value: 'tea' },
  { label: 'Juice', value: 'juice' },
  { label: 'Soda', value: 'soda' },
  { label: 'Water', value: 'water' },
  { label: 'Mocktail', value: 'mocktail' },
  { label: 'Other', value: 'other' },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #2
export default function AddBeverageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { addWine, isAddingWine, addBeer, addSpirit, addCocktail, addNonAlcoholic, isAddingBeer, isAddingSpirit, isAddingCocktail, isAddingNonAlcoholic } = useBeverages();

  const initialCategory = (params.category as BeverageCategory) || 'wine';
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory>(initialCategory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPairings, setIsGeneratingPairings] = useState(false);

  const [wineForm, setWineForm] = useState({
    name: '', producer: '', type: 'red' as WineType, vintage: '', region: '', country: '',
    grape: '', alcoholContent: '', price: '', glassPrice: '', tastingNotes: '', quantity: '', imageUrl: '',
  });
  const [beerForm, setBeerForm] = useState({
    name: '', brewery: '', type: 'lager' as BeerType, style: '', abv: '', ibu: '',
    origin: '', price: '', servingSize: '16oz', description: '', quantity: '', imageUrl: '',
  });
  const [spiritForm, setSpiritForm] = useState({
    name: '', brand: '', type: 'whiskey' as SpiritType, origin: '', age: '', abv: '',
    price: '', shotPrice: '', description: '', quantity: '', imageUrl: '',
  });
  const [cocktailForm, setCocktailForm] = useState({
    name: '', type: 'signature' as CocktailType, baseSpirit: '', garnish: '', glassType: '',
    price: '', description: '', isSignature: false, imageUrl: '',
  });
  const [nonAlcForm, setNonAlcForm] = useState({
    name: '', brand: '', type: 'coffee' as NonAlcoholicType, description: '', price: '',
    servingSize: '', calories: '', quantity: '', imageUrl: '',
  });

  const [foodPairings, setFoodPairings] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [mixers, setMixers] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [featured, setFeatured] = useState(false);

  const isSubmitting = isAddingWine || isAddingBeer || isAddingSpirit || isAddingCocktail || isAddingNonAlcoholic;

  // Bundle passed to the AI prompt builders.
  const promptForms = {
    wine: wineForm,
    beer: beerForm,
    spirit: spiritForm,
    cocktail: cocktailForm,
    nonAlcoholic: nonAlcForm,
    ingredients,
  };

  const handleGenerateDescription = async () => {
    const built = buildDescriptionPrompt(selectedCategory, promptForms);
    if (built.error !== undefined) {
      Alert.alert('Missing Info', built.error);
      return;
    }
    const prompt = built.prompt;

    setIsGenerating(true);
    try {
      const result = await generateText(prompt);
      switch (selectedCategory) {
        case 'wine': setWineForm(prev => ({ ...prev, tastingNotes: result })); break;
        case 'beer': setBeerForm(prev => ({ ...prev, description: result })); break;
        case 'spirit': setSpiritForm(prev => ({ ...prev, description: result })); break;
        case 'cocktail': setCocktailForm(prev => ({ ...prev, description: result })); break;
        case 'non-alcoholic': setNonAlcForm(prev => ({ ...prev, description: result })); break;
      }
      if (Platform.OS !== 'web') { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    } catch (error) {
      console.log('Error generating description:', error);
      Alert.alert('Error', 'Failed to generate description.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── NEW: AI Food Pairing Generation ──────────────────────────────
  const handleGeneratePairings = async () => {
    const built = buildPairingsPrompt(selectedCategory, promptForms);
    if (built.error !== undefined) {
      Alert.alert('Missing Info', built.error);
      return;
    }
    const prompt = built.prompt;

    setIsGeneratingPairings(true);
    try {
      const result = await generateText(prompt);
      // Parse the comma-separated response into individual pairing items
      const pairings = result
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length < 50) // Filter out empty or absurdly long entries
        .map(item => {
          // Remove numbering like "1.", "1)", leading dashes, etc.
          return item.replace(/^\d+[\.\)]\s*/, '').replace(/^[-–—]\s*/, '').trim();
        })
        .filter(item => item.length > 0);

      if (pairings.length > 0) {
        // Add to existing pairings without duplicates
        setFoodPairings(prev => {
          const existing = new Set(prev.map(p => p.toLowerCase()));
          const newPairings = pairings.filter(p => !existing.has(p.toLowerCase()));
          return [...prev, ...newPairings];
        });
      } else {
        Alert.alert('Hmm', 'Could not parse pairing suggestions. Try again or add them manually.');
      }

      if (Platform.OS !== 'web') { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    } catch (error) {
      console.log('Error generating pairings:', error);
      Alert.alert('Error', 'Failed to generate food pairings.');
    } finally {
      setIsGeneratingPairings(false);
    }
  };
  // ── END: AI Food Pairing Generation ──────────────────────────────

  const handleAddListItem = (list: 'pairings' | 'ingredients' | 'mixers') => {
    if (!newItem.trim()) return;
    switch (list) {
      case 'pairings': setFoodPairings(prev => [...prev, newItem.trim()]); break;
      case 'ingredients': setIngredients(prev => [...prev, newItem.trim()]); break;
      case 'mixers': setMixers(prev => [...prev, newItem.trim()]); break;
    }
    setNewItem('');
  };

  const handleRemoveListItem = (list: 'pairings' | 'ingredients' | 'mixers', index: number) => {
    switch (list) {
      case 'pairings': setFoodPairings(prev => prev.filter((_, i) => i !== index)); break;
      case 'ingredients': setIngredients(prev => prev.filter((_, i) => i !== index)); break;
      case 'mixers': setMixers(prev => prev.filter((_, i) => i !== index)); break;
    }
  };

  // Validate and save the form for the active category. Returns an error
  // message when required fields are blank, or null once the item is saved.
  const saveCurrentCategory = async (): Promise<string | null> => {
    switch (selectedCategory) {
      case 'wine': {
        const error = missingFieldsMessage(
          [wineForm.name, wineForm.producer, wineForm.price],
          'Name, producer, and price are required',
        );
        if (error) return error;
        await addWine(buildWinePayload(wineForm, foodPairings, featured));
        return null;
      }
      case 'beer': {
        const error = missingFieldsMessage(
          [beerForm.name, beerForm.brewery, beerForm.price],
          'Name, brewery, and price are required',
        );
        if (error) return error;
        await addBeer(buildBeerPayload(beerForm, foodPairings, featured));
        return null;
      }
      case 'spirit': {
        const error = missingFieldsMessage(
          [spiritForm.name, spiritForm.brand, spiritForm.price],
          'Name, brand, and price are required',
        );
        if (error) return error;
        await addSpirit(buildSpiritPayload(spiritForm, mixers, featured));
        return null;
      }
      case 'cocktail': {
        const error = missingFieldsMessage(
          [cocktailForm.name, cocktailForm.price],
          'Name and price are required',
        );
        if (error) return error;
        await addCocktail(buildCocktailPayload(cocktailForm, ingredients, featured));
        return null;
      }
      case 'non-alcoholic': {
        const error = missingFieldsMessage(
          [nonAlcForm.name, nonAlcForm.price],
          'Name and price are required',
        );
        if (error) return error;
        await addNonAlcoholic(buildNonAlcoholicPayload(nonAlcForm, ingredients, featured));
        return null;
      }
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      const error = await saveCurrentCategory();
      if (error) {
        Alert.alert('Error', error);
        return;
      }
      if (Platform.OS !== 'web') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      router.back();
    } catch (error) {
      console.log('Error adding beverage:', error);
      Alert.alert('Error', 'Failed to add beverage');
    }
  };

  const getTypeOptions = () => {
    switch (selectedCategory) {
      case 'wine': return wineTypes;
      case 'beer': return beerTypes;
      case 'spirit': return spiritTypes;
      case 'cocktail': return cocktailTypes;
      case 'non-alcoholic': return nonAlcTypes;
      default: return [];
    }
  };

  const getCurrentType = () => {
    switch (selectedCategory) {
      case 'wine': return wineForm.type;
      case 'beer': return beerForm.type;
      case 'spirit': return spiritForm.type;
      case 'cocktail': return cocktailForm.type;
      case 'non-alcoholic': return nonAlcForm.type;
      default: return '';
    }
  };

  const setCurrentType = (value: string) => {
    switch (selectedCategory) {
      case 'wine': setWineForm(prev => ({ ...prev, type: value as WineType })); break;
      case 'beer': setBeerForm(prev => ({ ...prev, type: value as BeerType })); break;
      case 'spirit': setSpiritForm(prev => ({ ...prev, type: value as SpiritType })); break;
      case 'cocktail': setCocktailForm(prev => ({ ...prev, type: value as CocktailType })); break;
      case 'non-alcoholic': setNonAlcForm(prev => ({ ...prev, type: value as NonAlcoholicType })); break;
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.categoryCard, selectedCategory === cat.value && styles.categoryCardSelected]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            {React.cloneElement(cat.icon as React.ReactElement<{ color: string }>, {
              color: selectedCategory === cat.value ? Colors.white : categoryColors[cat.value],
            })}
            <Text style={[styles.categoryLabel, selectedCategory === cat.value && styles.categoryLabelSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTypeSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeSelector}>
        {getTypeOptions().map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.typeChip, getCurrentType() === type.value && styles.typeChipSelected]}
            onPress={() => setCurrentType(type.value)}
          >
            <Text style={[styles.typeChipText, getCurrentType() === type.value && styles.typeChipTextSelected]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Reusable Food Pairings Section with AI Generate ──────────────
  const renderFoodPairingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Food Pairings</Text>
      <View style={styles.formCard}>
        <View style={styles.listInput}>
          <TextInput
            style={[styles.input, styles.flex1]}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add food pairing"
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={() => handleAddListItem('pairings')}
          />
          <TouchableOpacity style={styles.addItemButton} onPress={() => handleAddListItem('pairings')}>
            <Plus size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        {foodPairings.length > 0 && (
          <View style={styles.chipContainer}>
            {foodPairings.map((item, index) => (
              <TouchableOpacity key={index} style={styles.chip} onPress={() => handleRemoveListItem('pairings', index)}>
                <Text style={styles.chipText}>{item}</Text>
                <X size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.generateButton, isGeneratingPairings && styles.generateButtonDisabled]}
          onPress={handleGeneratePairings}
          disabled={isGeneratingPairings}
        >
          <Utensils size={18} color={isGeneratingPairings ? Colors.textMuted : Colors.primary} />
          <Text style={[styles.generateButtonText, isGeneratingPairings && styles.generateButtonTextDisabled]}>
            {isGeneratingPairings ? 'Generating Pairings...' : 'Suggest Pairings with AI'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  // ── END: Reusable Food Pairings Section ──────────────────────────

  const renderWineForm = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wine Name *</Text>
            <TextInput style={styles.input} value={wineForm.name} onChangeText={(v) => setWineForm(p => ({ ...p, name: v }))} placeholder="e.g., Château Margaux" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Producer *</Text>
            <TextInput style={styles.input} value={wineForm.producer} onChangeText={(v) => setWineForm(p => ({ ...p, producer: v }))} placeholder="Winery name" placeholderTextColor={Colors.textMuted} />
          </View>
          {renderTypeSelector()}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Vintage</Text>
              <TextInput style={styles.input} value={wineForm.vintage} onChangeText={(v) => setWineForm(p => ({ ...p, vintage: v }))} placeholder="2020" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Alcohol %</Text>
              <TextInput style={styles.input} value={wineForm.alcoholContent} onChangeText={(v) => setWineForm(p => ({ ...p, alcoholContent: v }))} placeholder="13.5" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grape Variety</Text>
            <TextInput style={styles.input} value={wineForm.grape} onChangeText={(v) => setWineForm(p => ({ ...p, grape: v }))} placeholder="e.g., Cabernet Sauvignon" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Region</Text>
              <TextInput style={styles.input} value={wineForm.region} onChangeText={(v) => setWineForm(p => ({ ...p, region: v }))} placeholder="Bordeaux" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Country</Text>
              <TextInput style={styles.input} value={wineForm.country} onChangeText={(v) => setWineForm(p => ({ ...p, country: v }))} placeholder="France" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Bottle Price *</Text>
              <TextInput style={styles.input} value={wineForm.price} onChangeText={(v) => setWineForm(p => ({ ...p, price: v }))} placeholder="45.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Glass Price</Text>
              <TextInput style={styles.input} value={wineForm.glassPrice} onChangeText={(v) => setWineForm(p => ({ ...p, glassPrice: v }))} placeholder="15.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity in Stock</Text>
            <TextInput style={styles.input} value={wineForm.quantity} onChangeText={(v) => setWineForm(p => ({ ...p, quantity: v }))} placeholder="12" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasting Notes</Text>
        <View style={styles.formCard}>
          <TextInput style={[styles.input, styles.textArea]} value={wineForm.tastingNotes} onChangeText={(v) => setWineForm(p => ({ ...p, tastingNotes: v }))} placeholder="Describe aromas, taste, and finish..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} onPress={handleGenerateDescription} disabled={isGenerating}>
            <Sparkles size={18} color={isGenerating ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.generateButtonText, isGenerating && styles.generateButtonTextDisabled]}>{isGenerating ? 'Generating...' : 'Generate with AI'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderBeerForm = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Beer Name *</Text>
            <TextInput style={styles.input} value={beerForm.name} onChangeText={(v) => setBeerForm(p => ({ ...p, name: v }))} placeholder="e.g., Pliny the Elder" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brewery *</Text>
            <TextInput style={styles.input} value={beerForm.brewery} onChangeText={(v) => setBeerForm(p => ({ ...p, brewery: v }))} placeholder="Brewery name" placeholderTextColor={Colors.textMuted} />
          </View>
          {renderTypeSelector()}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Style</Text>
            <TextInput style={styles.input} value={beerForm.style} onChangeText={(v) => setBeerForm(p => ({ ...p, style: v }))} placeholder="e.g., Double IPA" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>ABV %</Text>
              <TextInput style={styles.input} value={beerForm.abv} onChangeText={(v) => setBeerForm(p => ({ ...p, abv: v }))} placeholder="6.5" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>IBU</Text>
              <TextInput style={styles.input} value={beerForm.ibu} onChangeText={(v) => setBeerForm(p => ({ ...p, ibu: v }))} placeholder="65" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origin</Text>
            <TextInput style={styles.input} value={beerForm.origin} onChangeText={(v) => setBeerForm(p => ({ ...p, origin: v }))} placeholder="California, USA" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Serving</Text>
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput style={styles.input} value={beerForm.price} onChangeText={(v) => setBeerForm(p => ({ ...p, price: v }))} placeholder="8.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Serving Size</Text>
              <TextInput style={styles.input} value={beerForm.servingSize} onChangeText={(v) => setBeerForm(p => ({ ...p, servingSize: v }))} placeholder="16oz" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity in Stock</Text>
            <TextInput style={styles.input} value={beerForm.quantity} onChangeText={(v) => setBeerForm(p => ({ ...p, quantity: v }))} placeholder="24" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.formCard}>
          <TextInput style={[styles.input, styles.textArea]} value={beerForm.description} onChangeText={(v) => setBeerForm(p => ({ ...p, description: v }))} placeholder="Describe the beer..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} onPress={handleGenerateDescription} disabled={isGenerating}>
            <Sparkles size={18} color={isGenerating ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.generateButtonText, isGenerating && styles.generateButtonTextDisabled]}>{isGenerating ? 'Generating...' : 'Generate with AI'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderSpiritForm = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Spirit Name *</Text>
            <TextInput style={styles.input} value={spiritForm.name} onChangeText={(v) => setSpiritForm(p => ({ ...p, name: v }))} placeholder="e.g., Macallan 18" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput style={styles.input} value={spiritForm.brand} onChangeText={(v) => setSpiritForm(p => ({ ...p, brand: v }))} placeholder="Brand name" placeholderTextColor={Colors.textMuted} />
          </View>
          {renderTypeSelector()}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={spiritForm.age} onChangeText={(v) => setSpiritForm(p => ({ ...p, age: v }))} placeholder="12 Years" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>ABV %</Text>
              <TextInput style={styles.input} value={spiritForm.abv} onChangeText={(v) => setSpiritForm(p => ({ ...p, abv: v }))} placeholder="40" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origin</Text>
            <TextInput style={styles.input} value={spiritForm.origin} onChangeText={(v) => setSpiritForm(p => ({ ...p, origin: v }))} placeholder="Scotland" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Bottle Price *</Text>
              <TextInput style={styles.input} value={spiritForm.price} onChangeText={(v) => setSpiritForm(p => ({ ...p, price: v }))} placeholder="45.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Shot Price</Text>
              <TextInput style={styles.input} value={spiritForm.shotPrice} onChangeText={(v) => setSpiritForm(p => ({ ...p, shotPrice: v }))} placeholder="12.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity in Stock</Text>
            <TextInput style={styles.input} value={spiritForm.quantity} onChangeText={(v) => setSpiritForm(p => ({ ...p, quantity: v }))} placeholder="4" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.formCard}>
          <TextInput style={[styles.input, styles.textArea]} value={spiritForm.description} onChangeText={(v) => setSpiritForm(p => ({ ...p, description: v }))} placeholder="Describe nose, palate, and finish..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} onPress={handleGenerateDescription} disabled={isGenerating}>
            <Sparkles size={18} color={isGenerating ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.generateButtonText, isGenerating && styles.generateButtonTextDisabled]}>{isGenerating ? 'Generating...' : 'Generate with AI'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mixers</Text>
        <View style={styles.formCard}>
          <View style={styles.listInput}>
            <TextInput style={[styles.input, styles.flex1]} value={newItem} onChangeText={setNewItem} placeholder="Add mixer" placeholderTextColor={Colors.textMuted} onSubmitEditing={() => handleAddListItem('mixers')} />
            <TouchableOpacity style={styles.addItemButton} onPress={() => handleAddListItem('mixers')}>
              <Plus size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          {mixers.length > 0 && (
            <View style={styles.chipContainer}>
              {mixers.map((item, index) => (
                <TouchableOpacity key={index} style={styles.chip} onPress={() => handleRemoveListItem('mixers', index)}>
                  <Text style={styles.chipText}>{item}</Text>
                  <X size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </>
  );

  const renderCocktailForm = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cocktail Name *</Text>
            <TextInput style={styles.input} value={cocktailForm.name} onChangeText={(v) => setCocktailForm(p => ({ ...p, name: v }))} placeholder="e.g., Smoke & Mirrors" placeholderTextColor={Colors.textMuted} />
          </View>
          {renderTypeSelector()}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Base Spirit</Text>
            <TextInput style={styles.input} value={cocktailForm.baseSpirit} onChangeText={(v) => setCocktailForm(p => ({ ...p, baseSpirit: v }))} placeholder="e.g., Mezcal" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Glass Type</Text>
              <TextInput style={styles.input} value={cocktailForm.glassType} onChangeText={(v) => setCocktailForm(p => ({ ...p, glassType: v }))} placeholder="Coupe" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput style={styles.input} value={cocktailForm.price} onChangeText={(v) => setCocktailForm(p => ({ ...p, price: v }))} placeholder="16.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Garnish</Text>
            <TextInput style={styles.input} value={cocktailForm.garnish} onChangeText={(v) => setCocktailForm(p => ({ ...p, garnish: v }))} placeholder="Orange peel" placeholderTextColor={Colors.textMuted} />
          </View>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setCocktailForm(p => ({ ...p, isSignature: !p.isSignature }))}>
            <View style={[styles.checkbox, cocktailForm.isSignature && styles.checkboxChecked]}>
              {cocktailForm.isSignature && <Check size={14} color={Colors.white} />}
            </View>
            <Text style={styles.toggleLabel}>This is a signature cocktail</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.formCard}>
          <View style={styles.listInput}>
            <TextInput style={[styles.input, styles.flex1]} value={newItem} onChangeText={setNewItem} placeholder="Add ingredient" placeholderTextColor={Colors.textMuted} onSubmitEditing={() => handleAddListItem('ingredients')} />
            <TouchableOpacity style={styles.addItemButton} onPress={() => handleAddListItem('ingredients')}>
              <Plus size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          {ingredients.length > 0 && (
            <View style={styles.chipContainer}>
              {ingredients.map((item, index) => (
                <TouchableOpacity key={index} style={styles.chip} onPress={() => handleRemoveListItem('ingredients', index)}>
                  <Text style={styles.chipText}>{item}</Text>
                  <X size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.formCard}>
          <TextInput style={[styles.input, styles.textArea]} value={cocktailForm.description} onChangeText={(v) => setCocktailForm(p => ({ ...p, description: v }))} placeholder="Describe the cocktail..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} onPress={handleGenerateDescription} disabled={isGenerating}>
            <Sparkles size={18} color={isGenerating ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.generateButtonText, isGenerating && styles.generateButtonTextDisabled]}>{isGenerating ? 'Generating...' : 'Generate with AI'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderNonAlcForm = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Beverage Name *</Text>
            <TextInput style={styles.input} value={nonAlcForm.name} onChangeText={(v) => setNonAlcForm(p => ({ ...p, name: v }))} placeholder="e.g., Fresh Squeezed OJ" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand</Text>
            <TextInput style={styles.input} value={nonAlcForm.brand} onChangeText={(v) => setNonAlcForm(p => ({ ...p, brand: v }))} placeholder="Brand name (or leave blank for house)" placeholderTextColor={Colors.textMuted} />
          </View>
          {renderTypeSelector()}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput style={styles.input} value={nonAlcForm.price} onChangeText={(v) => setNonAlcForm(p => ({ ...p, price: v }))} placeholder="5.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Serving Size</Text>
              <TextInput style={styles.input} value={nonAlcForm.servingSize} onChangeText={(v) => setNonAlcForm(p => ({ ...p, servingSize: v }))} placeholder="12oz" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Calories</Text>
              <TextInput style={styles.input} value={nonAlcForm.calories} onChangeText={(v) => setNonAlcForm(p => ({ ...p, calories: v }))} placeholder="120" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput style={styles.input} value={nonAlcForm.quantity} onChangeText={(v) => setNonAlcForm(p => ({ ...p, quantity: v }))} placeholder="50" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.formCard}>
          <TextInput style={[styles.input, styles.textArea]} value={nonAlcForm.description} onChangeText={(v) => setNonAlcForm(p => ({ ...p, description: v }))} placeholder="Describe the beverage..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} onPress={handleGenerateDescription} disabled={isGenerating}>
            <Sparkles size={18} color={isGenerating ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.generateButtonText, isGenerating && styles.generateButtonTextDisabled]}>{isGenerating ? 'Generating...' : 'Generate with AI'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.formCard}>
          <View style={styles.listInput}>
            <TextInput style={[styles.input, styles.flex1]} value={newItem} onChangeText={setNewItem} placeholder="Add ingredient" placeholderTextColor={Colors.textMuted} onSubmitEditing={() => handleAddListItem('ingredients')} />
            <TouchableOpacity style={styles.addItemButton} onPress={() => handleAddListItem('ingredients')}>
              <Plus size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          {ingredients.length > 0 && (
            <View style={styles.chipContainer}>
              {ingredients.map((item, index) => (
                <TouchableOpacity key={index} style={styles.chip} onPress={() => handleRemoveListItem('ingredients', index)}>
                  <Text style={styles.chipText}>{item}</Text>
                  <X size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </>
  );

  const renderForm = () => {
    switch (selectedCategory) {
      case 'wine': return renderWineForm();
      case 'beer': return renderBeerForm();
      case 'spirit': return renderSpiritForm();
      case 'cocktail': return renderCocktailForm();
      case 'non-alcoholic': return renderNonAlcForm();
      default: return null;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Beverage',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderCategorySelector()}
          {renderForm()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            <View style={styles.formCard}>
              <TouchableOpacity style={styles.toggleRow} onPress={() => setFeatured(!featured)}>
                <View style={[styles.checkbox, featured && styles.checkboxChecked]}>
                  {featured && <Check size={14} color={Colors.white} />}
                </View>
                <Text style={styles.toggleLabel}>Feature on menu</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Food Pairings — now available for ALL categories with AI generation */}
          {renderFoodPairingsSection()}

          <View style={styles.submitSection}>
            <Button
              title={`Add ${selectedCategory === 'non-alcoholic' ? 'Beverage' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  formCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: { flex: 1, minWidth: '30%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  categoryCardSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  categoryLabelSelected: { color: Colors.white },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
  textArea: { minHeight: 100, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  typeChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 14, fontWeight: '500' as const, color: Colors.textSecondary },
  typeChipTextSelected: { color: Colors.white },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary + '12', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary + '30', borderStyle: 'dashed', marginTop: 12 },
  generateButtonDisabled: { backgroundColor: Colors.background, borderColor: Colors.border },
  generateButtonText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
  generateButtonTextDisabled: { color: Colors.textMuted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleLabel: { fontSize: 15, color: Colors.text },
  listInput: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addItemButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondary + '20', paddingLeft: 14, paddingRight: 10, paddingVertical: 8, borderRadius: 20, gap: 8 },
  chipText: { fontSize: 14, fontWeight: '500' as const, color: Colors.accent },
  submitSection: { paddingHorizontal: 20, marginTop: 24 },
  bottomPadding: { height: 40 },
});
