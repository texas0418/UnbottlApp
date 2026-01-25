import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  FileSpreadsheet,
  Upload,
  Check,
  AlertCircle,
  Wine,
  Beer,
  GlassWater,
  Martini,
  Coffee,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { BeverageCategory } from '@/types';

type ImportCategory = BeverageCategory;

interface ParsedRow {
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const categoryConfig: Record<ImportCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
  requiredFields: string[];
  optionalFields: string[];
  template: string;
}> = {
  wine: {
    label: 'Wine',
    icon: <Wine size={20} color="#8B2252" />,
    color: '#8B2252',
    requiredFields: ['name', 'producer', 'type', 'price'],
    optionalFields: ['vintage', 'region', 'country', 'grape', 'alcoholContent', 'glassPrice', 'tastingNotes', 'foodPairings', 'quantity', 'inStock', 'featured'],
    template: `name,producer,type,vintage,region,country,grape,alcoholContent,price,glassPrice,tastingNotes,foodPairings,quantity,inStock,featured
Chateau Margaux 2015,Chateau Margaux,red,2015,Bordeaux,France,Cabernet Sauvignon,13.5,450,45,"Rich dark fruit with elegant tannins","Beef|Lamb|Hard Cheese",6,true,true
Cloudy Bay Sauvignon Blanc,Cloudy Bay,white,2022,Marlborough,New Zealand,Sauvignon Blanc,13,45,12,"Crisp citrus and tropical notes","Seafood|Salads|Goat Cheese",12,true,false`,
  },
  beer: {
    label: 'Beer',
    icon: <Beer size={20} color="#D4A017" />,
    color: '#D4A017',
    requiredFields: ['name', 'brewery', 'type', 'price'],
    optionalFields: ['style', 'abv', 'ibu', 'origin', 'servingSize', 'description', 'foodPairings', 'quantity', 'inStock', 'featured'],
    template: `name,brewery,type,style,abv,ibu,origin,price,servingSize,description,foodPairings,quantity,inStock,featured
Pliny the Elder,Russian River Brewing,ipa,Double IPA,8,100,California USA,12,16oz,"Bold hoppy double IPA with citrus notes","Burgers|Spicy Food|Pizza",24,true,true
Pilsner Urquell,Pilsner Urquell,pilsner,Czech Pilsner,4.4,40,Czech Republic,8,12oz,"The original golden lager","Lighter fare|Salads|Fish",36,true,false`,
  },
  spirit: {
    label: 'Spirit',
    icon: <GlassWater size={20} color="#4A6741" />,
    color: '#4A6741',
    requiredFields: ['name', 'brand', 'type', 'price'],
    optionalFields: ['origin', 'age', 'abv', 'shotPrice', 'description', 'mixers', 'quantity', 'inStock', 'featured'],
    template: `name,brand,type,origin,age,abv,price,shotPrice,description,mixers,quantity,inStock,featured
Macallan 18,Macallan,whiskey,Scotland,18 Year,43,350,25,"Rich sherry oak with dried fruits and spice","Neat|Water|Ice",4,true,true
Patron Silver,Patron,tequila,Mexico,,40,55,8,"Smooth 100% blue agave tequila","Lime|Triple Sec|Margarita Mix",12,true,false`,
  },
  cocktail: {
    label: 'Cocktail',
    icon: <Martini size={20} color="#6B4E71" />,
    color: '#6B4E71',
    requiredFields: ['name', 'type', 'baseSpirit', 'price'],
    optionalFields: ['ingredients', 'garnish', 'glassType', 'description', 'isSignature', 'isAvailable', 'featured'],
    template: `name,type,baseSpirit,ingredients,garnish,glassType,price,description,isSignature,isAvailable,featured
Midnight Manhattan,signature,Bourbon,"Bourbon|Sweet Vermouth|Angostura Bitters|Cherry Syrup",Luxardo Cherry,Coupe,16,"Our twist on the classic with house-made cherry syrup",true,true,true
Classic Margarita,classic,Tequila,"Tequila|Triple Sec|Fresh Lime Juice",Salt Rim & Lime,Rocks,14,"Traditional margarita with fresh squeezed lime",false,true,false`,
  },
  'non-alcoholic': {
    label: 'Non-Alcoholic',
    icon: <Coffee size={20} color="#5D4E37" />,
    color: '#5D4E37',
    requiredFields: ['name', 'type', 'price'],
    optionalFields: ['brand', 'description', 'servingSize', 'calories', 'ingredients', 'quantity', 'inStock', 'featured'],
    template: `name,brand,type,description,price,servingSize,calories,ingredients,quantity,inStock,featured
House Lemonade,,juice,"Fresh squeezed lemonade with mint",5,16oz,120,"Lemons|Sugar|Mint|Water",50,true,true
Espresso,Lavazza,coffee,"Double shot Italian espresso",4,2oz,5,"Espresso Beans",100,true,false`,
  },
};

export default function CSVImportScreen() {
  const router = useRouter();
  const { addWine } = useWines();
  const { addBeer, addSpirit, addCocktail, addNonAlcoholic } = useBeverages();

  const [selectedCategory, setSelectedCategory] = useState<ImportCategory>('wine');
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [showTemplate, setShowTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const config = categoryConfig[selectedCategory];

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, string> = {};
      const errors: string[] = [];

      headers.forEach((header, index) => {
        data[header] = values[index]?.trim() || '';
      });

      config.requiredFields.forEach(field => {
        if (!data[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      });

      if (selectedCategory === 'wine' && data.type) {
        const validTypes = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
        if (!validTypes.includes(data.type.toLowerCase())) {
          errors.push(`Invalid wine type: ${data.type}`);
        }
      }

      rows.push({
        data,
        errors,
        isValid: errors.length === 0,
      });
    }

    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const handleParse = () => {
    if (!csvText.trim()) {
      Alert.alert('Error', 'Please paste CSV data first');
      return;
    }
    const parsed = parseCSV(csvText);
    setParsedData(parsed);
    setImportResult(null);
  };

  const handleCopyTemplate = async () => {
    await Clipboard.setStringAsync(config.template);
    Alert.alert('Copied!', 'Template copied to clipboard');
  };

  const handleImport = async () => {
    const validRows = parsedData.filter(row => row.isValid);
    if (validRows.length === 0) {
      Alert.alert('Error', 'No valid rows to import');
      return;
    }

    setIsImporting(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const row of validRows) {
      try {
        await importRow(row.data);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to import ${row.data.name}: ${error}`);
      }
    }

    setIsImporting(false);
    setImportResult(result);

    if (result.success > 0) {
      Alert.alert(
        'Import Complete',
        `Successfully imported ${result.success} items${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        [{ text: 'OK', onPress: () => result.failed === 0 && router.back() }]
      );
    }
  };

  const importRow = async (data: Record<string, string>) => {
    const timestamp = new Date().toISOString();

    switch (selectedCategory) {
      case 'wine':
        await addWine({
          name: data.name,
          producer: data.producer,
          type: data.type as any,
          vintage: data.vintage ? parseInt(data.vintage) : null,
          region: data.region || '',
          country: data.country || '',
          grape: data.grape || '',
          alcoholContent: parseFloat(data.alcoholcontent) || 13,
          price: parseFloat(data.price) || 0,
          glassPrice: data.glassprice ? parseFloat(data.glassprice) : null,
          tastingNotes: data.tastingnotes || '',
          foodPairings: data.foodpairings ? data.foodpairings.split('|') : [],
          quantity: parseInt(data.quantity) || 0,
          inStock: data.instock?.toLowerCase() === 'true',
          featured: data.featured?.toLowerCase() === 'true',
          imageUrl: null,
          flavorProfile: { body: 3, sweetness: 2, tannins: 3, acidity: 3 },
          dietaryTags: [],
        });
        break;

      case 'beer':
        await addBeer({
          name: data.name,
          brewery: data.brewery,
          type: data.type as any,
          style: data.style || '',
          abv: parseFloat(data.abv) || 5,
          ibu: data.ibu ? parseInt(data.ibu) : null,
          origin: data.origin || '',
          price: parseFloat(data.price) || 0,
          servingSize: data.servingsize || '12oz',
          description: data.description || '',
          foodPairings: data.foodpairings ? data.foodpairings.split('|') : [],
          quantity: parseInt(data.quantity) || 0,
          inStock: data.instock?.toLowerCase() === 'true',
          featured: data.featured?.toLowerCase() === 'true',
          imageUrl: null,
          beerProfile: { bitterness: 3, maltiness: 3, hoppy: 3, body: 3 },
          dietaryTags: [],
        });
        break;

      case 'spirit':
        await addSpirit({
          name: data.name,
          brand: data.brand,
          type: data.type as any,
          origin: data.origin || '',
          age: data.age || null,
          abv: parseFloat(data.abv) || 40,
          price: parseFloat(data.price) || 0,
          shotPrice: data.shotprice ? parseFloat(data.shotprice) : null,
          description: data.description || '',
          mixers: data.mixers ? data.mixers.split('|') : [],
          quantity: parseInt(data.quantity) || 0,
          inStock: data.instock?.toLowerCase() === 'true',
          featured: data.featured?.toLowerCase() === 'true',
          imageUrl: null,
          spiritProfile: { smoothness: 3, complexity: 3, sweetness: 2, intensity: 3 },
          dietaryTags: [],
        });
        break;

      case 'cocktail':
        await addCocktail({
          name: data.name,
          type: data.type as any,
          baseSpirit: data.basespirit,
          ingredients: data.ingredients ? data.ingredients.split('|') : [],
          garnish: data.garnish || '',
          glassType: data.glasstype || 'Rocks',
          price: parseFloat(data.price) || 0,
          description: data.description || '',
          isSignature: data.issignature?.toLowerCase() === 'true',
          isAvailable: data.isavailable?.toLowerCase() !== 'false',
          featured: data.featured?.toLowerCase() === 'true',
          imageUrl: null,
          dietaryTags: [],
        });
        break;

      case 'non-alcoholic':
        await addNonAlcoholic({
          name: data.name,
          brand: data.brand || null,
          type: data.type as any,
          description: data.description || '',
          price: parseFloat(data.price) || 0,
          servingSize: data.servingsize || '12oz',
          calories: data.calories ? parseInt(data.calories) : null,
          ingredients: data.ingredients ? data.ingredients.split('|') : [],
          quantity: parseInt(data.quantity) || 0,
          inStock: data.instock?.toLowerCase() !== 'false',
          featured: data.featured?.toLowerCase() === 'true',
          imageUrl: null,
          dietaryTags: [],
        });
        break;
    }
  };

  const validCount = useMemo(() => parsedData.filter(r => r.isValid).length, [parsedData]);
  const invalidCount = useMemo(() => parsedData.filter(r => !r.isValid).length, [parsedData]);

  const handleClearData = () => {
    setCsvText('');
    setParsedData([]);
    setImportResult(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FileSpreadsheet size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>CSV Import</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {(Object.keys(categoryConfig) as ImportCategory[]).map((cat) => {
                const cfg = categoryConfig[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: cfg.color },
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setParsedData([]);
                      setImportResult(null);
                    }}
                  >
                    {React.cloneElement(cfg.icon as React.ReactElement<{ color: string }>, {
                      color: isSelected ? Colors.white : cfg.color,
                    })}
                    <Text style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.templateHeader}
            onPress={() => setShowTemplate(!showTemplate)}
          >
            <Text style={styles.sectionTitle}>CSV Template</Text>
            {showTemplate ? (
              <ChevronUp size={20} color={Colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
          
          {showTemplate && (
            <View style={styles.templateContainer}>
              <View style={styles.templateInfo}>
                <Text style={styles.templateLabel}>Required fields:</Text>
                <Text style={styles.templateFields}>
                  {config.requiredFields.join(', ')}
                </Text>
                <Text style={[styles.templateLabel, { marginTop: 8 }]}>Optional fields:</Text>
                <Text style={styles.templateFields}>
                  {config.optionalFields.join(', ')}
                </Text>
                <Text style={[styles.templateLabel, { marginTop: 8 }]}>Note:</Text>
                <Text style={styles.templateFields}>
                  Use | to separate multiple values (e.g., "Beef|Lamb|Cheese")
                </Text>
              </View>
              <View style={styles.templateBox}>
                <ScrollView horizontal>
                  <Text style={styles.templateText} selectable>
                    {config.template}
                  </Text>
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyTemplate}>
                <Copy size={16} color={Colors.primary} />
                <Text style={styles.copyButtonText}>Copy Template</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paste CSV Data</Text>
            {csvText.length > 0 && (
              <TouchableOpacity onPress={handleClearData}>
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={8}
            placeholder={`Paste your ${config.label.toLowerCase()} CSV data here...`}
            placeholderTextColor={Colors.textMuted}
            value={csvText}
            onChangeText={setCsvText}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.parseButton, !csvText.trim() && styles.parseButtonDisabled]}
            onPress={handleParse}
            disabled={!csvText.trim()}
          >
            <Text style={styles.parseButtonText}>Parse CSV</Text>
          </TouchableOpacity>
        </View>

        {parsedData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview ({parsedData.length} rows)</Text>
            
            <View style={styles.statsRow}>
              <View style={[styles.statBadge, styles.statBadgeValid]}>
                <Check size={14} color="#16A34A" />
                <Text style={styles.statBadgeTextValid}>{validCount} valid</Text>
              </View>
              {invalidCount > 0 && (
                <View style={[styles.statBadge, styles.statBadgeInvalid]}>
                  <AlertCircle size={14} color={Colors.error} />
                  <Text style={styles.statBadgeTextInvalid}>{invalidCount} invalid</Text>
                </View>
              )}
            </View>

            <View style={styles.previewList}>
              {parsedData.slice(0, 10).map((row, index) => (
                <View
                  key={index}
                  style={[
                    styles.previewItem,
                    !row.isValid && styles.previewItemInvalid,
                  ]}
                >
                  <View style={styles.previewItemHeader}>
                    <Text style={styles.previewItemName} numberOfLines={1}>
                      {row.data.name || 'Unnamed'}
                    </Text>
                    {row.isValid ? (
                      <Check size={16} color="#16A34A" />
                    ) : (
                      <AlertCircle size={16} color={Colors.error} />
                    )}
                  </View>
                  {row.data.type && (
                    <Text style={styles.previewItemType}>{row.data.type}</Text>
                  )}
                  {row.errors.length > 0 && (
                    <View style={styles.errorList}>
                      {row.errors.map((error, errIndex) => (
                        <Text key={errIndex} style={styles.errorText}>
                          • {error}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {parsedData.length > 10 && (
                <Text style={styles.moreText}>
                  +{parsedData.length - 10} more items...
                </Text>
              )}
            </View>
          </View>
        )}

        {importResult && (
          <View style={styles.section}>
            <View style={[styles.resultBox, importResult.failed > 0 && styles.resultBoxWarning]}>
              <Text style={styles.resultTitle}>
                Import {importResult.failed === 0 ? 'Successful' : 'Completed with Errors'}
              </Text>
              <Text style={styles.resultText}>
                {importResult.success} items imported successfully
              </Text>
              {importResult.failed > 0 && (
                <Text style={styles.resultTextError}>
                  {importResult.failed} items failed
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {parsedData.length > 0 && validCount > 0 && !importResult && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.importButton, isImporting && styles.importButtonDisabled]}
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Upload size={20} color={Colors.white} />
                <Text style={styles.importButtonText}>
                  Import {validCount} {config.label}{validCount !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateContainer: {
    marginTop: 4,
  },
  templateInfo: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  templateFields: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  templateBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  templateText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#A9DC76',
    lineHeight: 18,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    minHeight: 160,
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  parseButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  parseButtonDisabled: {
    opacity: 0.5,
  },
  parseButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statBadgeValid: {
    backgroundColor: '#DCFCE7',
  },
  statBadgeInvalid: {
    backgroundColor: '#FEE2E2',
  },
  statBadgeTextValid: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#16A34A',
  },
  statBadgeTextInvalid: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.error,
  },
  previewList: {
    gap: 10,
  },
  previewItem: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  previewItemInvalid: {
    borderLeftColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  previewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  previewItemType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  errorList: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    lineHeight: 18,
  },
  moreText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  resultBox: {
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultBoxWarning: {
    backgroundColor: '#FEF3C7',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: '#16A34A',
  },
  resultTextError: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 2,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  importButtonDisabled: {
    opacity: 0.7,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
