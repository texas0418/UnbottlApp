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
import { X, Plus, Check, Sparkles, Wine, Beer, GlassWater, Martini, Coffee } from 'lucide-react-native';
import { generateText } from '@/services/ai-toolkit';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { BeverageCategory, WineType, BeerType, SpiritType, CocktailType, NonAlcoholicType } from '@/types';
import Button from '@/components/Button';
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

export default function AddBeverageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { addWine, isAddingWine } = useWines();
  const { addBeer, addSpirit, addCocktail, addNonAlcoholic, isAddingBeer, isAddingSpirit, isAddingCocktail, isAddingNonAlcoholic } = useBeverages();

  const initialCategory = (params.category as BeverageCategory) || 'wine';
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory>(initialCategory);
  const [isGenerating, setIsGenerating] = useState(false);

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
    name: '', brand: '', type: 'coffee' as NonAlcoholicType, description: '',
    price: '', servingSize: '', calories: '', quantity: '', imageUrl: '',
  });

  const [foodPairings, setFoodPairings] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [mixers, setMixers] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [featured, setFeatured] = useState(false);

  const isSubmitting = isAddingWine || isAddingBeer || isAddingSpirit || isAddingCocktail || isAddingNonAlcoholic;

  const handleGenerateDescription = async () => {
    let prompt = '';
    
    switch (selectedCategory) {
      case 'wine':
        if (!wineForm.name && !wineForm.grape && !wineForm.type) {
          Alert.alert('Missing Info', 'Please add wine details first.');
          return;
        }
        prompt = `Write a brief tasting note (2-3 sentences) for: ${wineForm.name || 'Unknown'} ${wineForm.type} wine from ${wineForm.region || 'Unknown'}, ${wineForm.country || 'Unknown'}. Grape: ${wineForm.grape || 'Unknown'}. Describe aromas and flavors.`;
        break;
      case 'beer':
        if (!beerForm.name && !beerForm.type) {
          Alert.alert('Missing Info', 'Please add beer details first.');
          return;
        }
        prompt = `Write a brief description (2-3 sentences) for: ${beerForm.name || 'Unknown'} ${beerForm.type} ${beerForm.style || ''} from ${beerForm.brewery || 'Unknown'}. ABV: ${beerForm.abv || 'Unknown'}%. Describe taste and character.`;
        break;
      case 'spirit':
        if (!spiritForm.name && !spiritForm.type) {
          Alert.alert('Missing Info', 'Please add spirit details first.');
          return;
        }
        prompt = `Write a brief tasting note (2-3 sentences) for: ${spiritForm.name || 'Unknown'} ${spiritForm.type} from ${spiritForm.origin || 'Unknown'}. Age: ${spiritForm.age || 'Unaged'}. Describe nose, palate, and finish.`;
        break;
      case 'cocktail':
        if (!cocktailForm.name) {
          Alert.alert('Missing Info', 'Please add cocktail name first.');
          return;
        }
        prompt = `Write a brief enticing description (2-3 sentences) for a cocktail called "${cocktailForm.name}" made with ${cocktailForm.baseSpirit || 'spirits'}. Ingredients: ${ingredients.join(', ') || 'various'}. Make it sound appealing.`;
        break;
      case 'non-alcoholic':
        if (!nonAlcForm.name) {
          Alert.alert('Missing Info', 'Please add beverage name first.');
          return;
        }
        prompt = `Write a brief description (2-3 sentences) for: ${nonAlcForm.name || 'Unknown'} (${nonAlcForm.type}). Make it sound refreshing and appealing.`;
        break;
    }

    setIsGenerating(true);
    try {
      const result = await generateText(prompt);
      switch (selectedCategory) {
        case 'wine':
          setWineForm(prev => ({ ...prev, tastingNotes: result }));
          break;
        case 'beer':
          setBeerForm(prev => ({ ...prev, description: result }));
          break;
        case 'spirit':
          setSpiritForm(prev => ({ ...prev, description: result }));
          break;
        case 'cocktail':
          setCocktailForm(prev => ({ ...prev, description: result }));
          break;
        case 'non-alcoholic':
          setNonAlcForm(prev => ({ ...prev, description: result }));
          break;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Error generating description:', error);
      Alert.alert('Error', 'Failed to generate description.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddListItem = (list: 'pairings' | 'ingredients' | 'mixers') => {
    if (!newItem.trim()) return;
    switch (list) {
      case 'pairings':
        setFoodPairings(prev => [...prev, newItem.trim()]);
        break;
      case 'ingredients':
        setIngredients(prev => [...prev, newItem.trim()]);
        break;
      case 'mixers':
        setMixers(prev => [...prev, newItem.trim()]);
        break;
    }
    setNewItem('');
  };

  const handleRemoveListItem = (list: 'pairings' | 'ingredients' | 'mixers', index: number) => {
    switch (list) {
      case 'pairings':
        setFoodPairings(prev => prev.filter((_, i) => i !== index));
        break;
      case 'ingredients':
        setIngredients(prev => prev.filter((_, i) => i !== index));
        break;
      case 'mixers':
        setMixers(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const handleSubmit = async () => {
    try {
      switch (selectedCategory) {
        case 'wine':
          if (!wineForm.name.trim() || !wineForm.producer.trim() || !wineForm.price.trim()) {
            Alert.alert('Error', 'Name, producer, and price are required');
            return;
          }
          await addWine({
            name: wineForm.name.trim(),
            producer: wineForm.producer.trim(),
            type: wineForm.type,
            vintage: wineForm.vintage ? parseInt(wineForm.vintage, 10) : null,
            region: wineForm.region.trim(),
            country: wineForm.country.trim(),
            grape: wineForm.grape.trim(),
            alcoholContent: parseFloat(wineForm.alcoholContent) || 0,
            price: parseFloat(wineForm.price) || 0,
            glassPrice: wineForm.glassPrice ? parseFloat(wineForm.glassPrice) : null,
            tastingNotes: wineForm.tastingNotes.trim(),
            foodPairings,
            inStock: true,
            quantity: parseInt(wineForm.quantity, 10) || 0,
            imageUrl: wineForm.imageUrl.trim() || null,
            featured,
            flavorProfile: { body: 3, sweetness: 2, tannins: 3, acidity: 3 },
            dietaryTags: [],
          });
          break;

        case 'beer':
          if (!beerForm.name.trim() || !beerForm.brewery.trim() || !beerForm.price.trim()) {
            Alert.alert('Error', 'Name, brewery, and price are required');
            return;
          }
          await addBeer({
            name: beerForm.name.trim(),
            brewery: beerForm.brewery.trim(),
            type: beerForm.type,
            style: beerForm.style.trim(),
            abv: parseFloat(beerForm.abv) || 0,
            ibu: beerForm.ibu ? parseInt(beerForm.ibu, 10) : null,
            origin: beerForm.origin.trim(),
            price: parseFloat(beerForm.price) || 0,
            servingSize: beerForm.servingSize.trim(),
            description: beerForm.description.trim(),
            foodPairings,
            inStock: true,
            quantity: parseInt(beerForm.quantity, 10) || 0,
            imageUrl: beerForm.imageUrl.trim() || null,
            featured,
            beerProfile: { bitterness: 3, maltiness: 3, hoppy: 3, body: 3 },
            dietaryTags: [],
          });
          break;

        case 'spirit':
          if (!spiritForm.name.trim() || !spiritForm.brand.trim() || !spiritForm.price.trim()) {
            Alert.alert('Error', 'Name, brand, and price are required');
            return;
          }
          await addSpirit({
            name: spiritForm.name.trim(),
            brand: spiritForm.brand.trim(),
            type: spiritForm.type,
            origin: spiritForm.origin.trim(),
            age: spiritForm.age.trim() || null,
            abv: parseFloat(spiritForm.abv) || 0,
            price: parseFloat(spiritForm.price) || 0,
            shotPrice: spiritForm.shotPrice ? parseFloat(spiritForm.shotPrice) : null,
            description: spiritForm.description.trim(),
            mixers,
            inStock: true,
            quantity: parseInt(spiritForm.quantity, 10) || 0,
            imageUrl: spiritForm.imageUrl.trim() || null,
            featured,
            spiritProfile: { smoothness: 3, complexity: 3, sweetness: 2, intensity: 3 },
            dietaryTags: [],
          });
          break;

        case 'cocktail':
          if (!cocktailForm.name.trim() || !cocktailForm.price.trim()) {
            Alert.alert('Error', 'Name and price are required');
            return;
          }
          await addCocktail({
            name: cocktailForm.name.trim(),
            type: cocktailForm.type,
            baseSpirit: cocktailForm.baseSpirit.trim(),
            ingredients,
            garnish: cocktailForm.garnish.trim(),
            glassType: cocktailForm.glassType.trim(),
            price: parseFloat(cocktailForm.price) || 0,
            description: cocktailForm.description.trim(),
            isSignature: cocktailForm.isSignature,
            isAvailable: true,
            imageUrl: cocktailForm.imageUrl.trim() || null,
            featured,
            dietaryTags: [],
          });
          break;

        case 'non-alcoholic':
          if (!nonAlcForm.name.trim() || !nonAlcForm.price.trim()) {
            Alert.alert('Error', 'Name and price are required');
            return;
          }
          await addNonAlcoholic({
            name: nonAlcForm.name.trim(),
            brand: nonAlcForm.brand.trim() || null,
            type: nonAlcForm.type,
            description: nonAlcForm.description.trim(),
            price: parseFloat(nonAlcForm.price) || 0,
            servingSize: nonAlcForm.servingSize.trim(),
            calories: nonAlcForm.calories ? parseInt(nonAlcForm.calories, 10) : null,
            ingredients,
            inStock: true,
            quantity: parseInt(nonAlcForm.quantity, 10) || 0,
            imageUrl: nonAlcForm.imageUrl.trim() || null,
            featured,
            dietaryTags: [],
          });
          break;
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
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
      case 'wine':
        setWineForm(prev => ({ ...prev, type: value as WineType }));
        break;
      case 'beer':
        setBeerForm(prev => ({ ...prev, type: value as BeerType }));
        break;
      case 'spirit':
        setSpiritForm(prev => ({ ...prev, type: value as SpiritType }));
        break;
      case 'cocktail':
        setCocktailForm(prev => ({ ...prev, type: value as CocktailType }));
        break;
      case 'non-alcoholic':
        setNonAlcForm(prev => ({ ...prev, type: value as NonAlcoholicType }));
        break;
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryCard,
              selectedCategory === cat.value && styles.categoryCardSelected,
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            {React.cloneElement(cat.icon as React.ReactElement<{ color: string }>, {
              color: selectedCategory === cat.value ? Colors.white : categoryColors[cat.value],
            })}
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.value && styles.categoryLabelSelected,
            ]}>
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
            style={[
              styles.typeChip,
              getCurrentType() === type.value && styles.typeChipSelected,
            ]}
            onPress={() => setCurrentType(type.value)}
          >
            <Text style={[
              styles.typeChipText,
              getCurrentType() === type.value && styles.typeChipTextSelected,
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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

          {(selectedCategory === 'wine' || selectedCategory === 'beer') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Food Pairings</Text>
              <View style={styles.formCard}>
                <View style={styles.listInput}>
                  <TextInput style={[styles.input, styles.flex1]} value={newItem} onChangeText={setNewItem} placeholder="Add food pairing" placeholderTextColor={Colors.textMuted} onSubmitEditing={() => handleAddListItem('pairings')} />
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
              </View>
            </View>
          )}

          <View style={styles.submitSection}>
            <Button title={`Add ${selectedCategory === 'non-alcoholic' ? 'Beverage' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`} onPress={handleSubmit} loading={isSubmitting} fullWidth size="large" />
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
