import React from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/colors';
import { cuisineCategories } from '@/constants/cuisines';

interface CuisineFilterProps {
  selected: string;
  onSelect: (value: string) => void;
}

export default function CuisineFilter({ selected, onSelect }: CuisineFilterProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Best wines for...</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {cuisineCategories.map((cuisine) => {
          const isSelected = selected === cuisine.id;
          const IconComponent = cuisine.icon;
          
          return (
            <TouchableOpacity
              key={cuisine.id}
              style={[
                styles.chip,
                isSelected && { backgroundColor: cuisine.color, borderColor: cuisine.color },
              ]}
              onPress={() => onSelect(cuisine.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isSelected && styles.iconContainerSelected,
              ]}>
                <IconComponent 
                  size={16} 
                  color={isSelected ? Colors.white : cuisine.color} 
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {cuisine.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    paddingHorizontal: 20,
  },
  container: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});
