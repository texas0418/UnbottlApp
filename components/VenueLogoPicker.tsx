import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { uploadVenueLogo } from '@/services/venueMedia';

interface VenueLogoPickerProps {
  /** Null before the venue is saved — uploads need an id to key the path on. */
  restaurantId: string | null;
  /** Current logo URL, if any. */
  value: string | null;
  onChange: (url: string | null) => void;
}

/**
 * Pick, resize and upload a venue's logo.
 *
 * The guest menu has been able to show a logo since the branding migration.
 * Nothing in the app could put one there, so every venue rendered with the
 * Unbottl default — the exact thing venue branding was meant to stop.
 */
export default function VenueLogoPicker({ restaurantId, value, onChange }: VenueLogoPickerProps) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (!restaurantId) {
      Alert.alert('Save your venue first', 'Add your restaurant, then you can upload a logo.');
      return;
    }

    // Asking only when the button is pressed. A permission sheet on screen
    // load, before anyone has said they want to upload anything, is the kind
    // of thing people deny out of reflex.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Unbottl needs access to your photos to upload a logo. You can turn it on in Settings.',
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Compression happens after the resize, not twice.
    });
    if (picked.canceled || !picked.assets?.[0]) return;

    setBusy(true);
    try {
      const { url } = await uploadVenueLogo(restaurantId, picked.assets[0].uri);
      onChange(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not upload the logo', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Logo</Text>
      <Text style={styles.hint}>
        Shown at the top of your guest menu. A square image works best.
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.preview}
          onPress={pick}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={value ? 'Replace logo' : 'Upload a logo'}
        >
          {busy ? (
            <ActivityIndicator color={Colors.primary} />
          ) : value ? (
            <Image source={{ uri: value }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <ImagePlus size={26} color={Colors.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity onPress={pick} disabled={busy} style={styles.action}>
            <Text style={styles.actionText}>{value ? 'Replace' : 'Upload a logo'}</Text>
          </TouchableOpacity>
          {value && !busy && (
            <TouchableOpacity
              onPress={() => onChange(null)}
              style={styles.action}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Remove logo"
            >
              <View style={styles.removeRow}>
                <Trash2 size={14} color={Colors.error} />
                <Text style={styles.removeText}>Remove</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  hint: { fontSize: 13, color: Colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  preview: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  actions: { gap: 10 },
  action: { minHeight: 44, justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '600' as const, color: Colors.primary },
  removeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeText: { fontSize: 14, color: Colors.error },
});
