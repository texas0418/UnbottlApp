import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { ChevronDown, Check, Building2, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Restaurant } from '@/types';

interface RestaurantSwitcherProps {
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  onSwitch: (id: string) => void;
  onAddNew?: () => void;
}

export default function RestaurantSwitcher({ 
  currentRestaurant, 
  restaurants, 
  onSwitch,
  onAddNew 
}: RestaurantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSwitch(id);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setIsOpen(true)}>
        <View style={styles.iconContainer}>
          <Building2 size={18} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Current Restaurant</Text>
          <Text style={styles.name} numberOfLines={1}>
            {currentRestaurant?.name || 'Select Restaurant'}
          </Text>
        </View>
        <ChevronDown size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Restaurant</Text>
            </View>
            
            <FlatList
              data={restaurants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.id === currentRestaurant?.id && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                  {item.id === currentRestaurant?.id && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            {onAddNew && (
              <TouchableOpacity style={styles.addButton} onPress={() => {
                setIsOpen(false);
                onAddNew();
              }}>
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addButtonText}>Add New Restaurant</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionSelected: {
    backgroundColor: Colors.primary + '08',
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  optionAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
