import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { UploadResult } from '@/services/venueMedia';

export interface MediaPickerProps {
  label: string;
  hint: string;
  /** Current image URL, if any. */
  value: string | null;
  onChange: (url: string | null) => void;
  /**
   * Runs the upload. Null disables the control — used when the thing being
   * illustrated has no id yet, because the storage path is keyed on that id.
   */
  upload: ((uri: string) => Promise<UploadResult>) | null;
  /** Shown when `upload` is null, so the reason is stated rather than implied. */
  disabledReason?: { title: string; message: string };
  /** Crop ratio. Square for a logo, wide for a cover. */
  aspect?: [number, number];
  /** Preview shape. A wide preview for a cover would be misleading as a square. */
  wide?: boolean;
}

/**
 * Pick, resize and upload one image.
 *
 * Every picture a venue can supply — logo, cover, a drink's photo — goes
 * through here, so permission handling, the resize, the busy state and the
 * failure message are written once. They were not, before: the guest menu could
 * display all three and the app offered no way to provide any of them.
 */
export default function MediaPicker({
  label,
  hint,
  value,
  onChange,
  upload,
  disabledReason,
  aspect = [1, 1],
  wide = false,
}: MediaPickerProps) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (!upload) {
      if (disabledReason) Alert.alert(disabledReason.title, disabledReason.message);
      return;
    }

    // Asked on press, not on screen load. A permission sheet that appears
    // before anyone has said they want to upload anything gets denied by
    // reflex, and a denial is far harder to undo than a prompt.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        `Unbottl needs access to your photos to upload ${label.toLowerCase()}. You can turn it on in Settings.`,
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 1, // Compression happens once, after the resize, in the service.
    });
    if (picked.canceled || !picked.assets?.[0]) return;

    setBusy(true);
    try {
      const { url } = await upload(picked.assets[0].uri);
      onChange(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(`Could not upload ${label.toLowerCase()}`, message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.preview, wide && styles.previewWide, !upload && styles.previewDisabled]}
          onPress={pick}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={value ? `Replace ${label}` : `Upload ${label}`}
        >
          {busy ? (
            <ActivityIndicator color={Colors.primary} />
          ) : value ? (
            <Image source={{ uri: value }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <ImagePlus size={26} color={upload ? Colors.primary : Colors.textMuted} />
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity onPress={pick} disabled={busy} style={styles.action}>
            <Text style={[styles.actionText, !upload && styles.actionDisabled]}>
              {value ? 'Replace' : `Upload ${label.toLowerCase()}`}
            </Text>
          </TouchableOpacity>
          {value && !busy && (
            <TouchableOpacity
              onPress={() => onChange(null)}
              style={styles.action}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
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
  previewWide: { width: 148 },
  previewDisabled: { opacity: 0.5 },
  previewImage: { width: '100%', height: '100%' },
  actions: { gap: 10, flex: 1 },
  action: { minHeight: 44, justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '600' as const, color: Colors.primary },
  actionDisabled: { color: Colors.textMuted },
  removeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeText: { fontSize: 14, color: Colors.error },
});
