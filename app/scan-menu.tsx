import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { X, QrCode, Camera as CameraIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { parseMenuSlug } from '@/services/publicMenu';

export default function ScanMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (handledRef.current) return;
    const slug = parseMenuSlug(result?.data ?? '');
    if (!slug) {
      setError("That doesn't look like an Unbottl menu code. Try again.");
      return;
    }
    handledRef.current = true;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/customer-menu', params: { r: slug } });
  };

  const close = () => router.back();

  // Permission still loading.
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  // Permission not granted yet.
  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 8 }]} onPress={close}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.permissionIcon}>
          <CameraIcon size={40} color={Colors.primary} />
        </View>
        <Text style={styles.permissionTitle}>Scan a restaurant menu</Text>
        <Text style={styles.permissionText}>
          Point your camera at an Unbottl QR code to instantly view that venue&apos;s drink menu.
          We&apos;ll need camera access to scan.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={close}>
          <Text style={styles.secondaryButtonText}>Not now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Web has no camera scanning support in this build.
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 8 }]} onPress={close}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.permissionIcon}>
          <QrCode size={40} color={Colors.primary} />
        </View>
        <Text style={styles.permissionTitle}>Open the app to scan</Text>
        <Text style={styles.permissionText}>
          QR menu scanning is available in the Unbottl mobile app.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Menu</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hint}>
            {error ?? "Point at a restaurant's Unbottl QR code"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  cameraContainer: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' as const, color: '#fff' },
  headerSpacer: { width: 40 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#fff' },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  hint: {
    color: '#fff',
    fontSize: 15,
    marginTop: 28,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '500' as const,
  },
  permissionIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' as const },
  secondaryButton: { paddingVertical: 14, marginTop: 4 },
  secondaryButtonText: { color: Colors.textMuted, fontSize: 15, fontWeight: '500' as const },
});
