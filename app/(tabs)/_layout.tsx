import { Tabs, useRouter } from "expo-router";
import { Compass, Bookmark, User, ScanLine } from "lucide-react-native";
import React from "react";
import { Platform, TouchableOpacity, View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import { useAgeVerification } from "@/hooks/useAgeVerification";

/**
 * Elevated center "Scan" button. It doesn't navigate to a tab screen — it
 * opens the menu scanner as a modal, so scanning is a prominent action rather
 * than a full page.
 */
function ScanButton() {
  const router = useRouter();
  return (
    <View style={styles.scanButtonContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.scanButton}
        activeOpacity={0.85}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          router.push("/scan-menu");
        }}
        accessibilityLabel="Scan a restaurant menu QR code"
      >
        <ScanLine size={26} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { isAgeVerified, isLoading, confirmAge, denyAge } = useAgeVerification();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.borderLight,
            paddingTop: 4,
            ...Platform.select({
              ios: {
                shadowColor: Colors.black,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
              },
              android: { elevation: 8 },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500' as const,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Discover",
            tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
          }}
        />
        {/* Merged into Discover — hidden from the tab bar but still routable. */}
        <Tabs.Screen name="catalog" options={{ href: null }} />
        <Tabs.Screen
          name="menu"
          options={{
            title: "Scan",
            tabBarButton: () => <ScanButton />,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Saved",
            tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* Age verification modal — shows once on first launch, then never again */}
      {!isLoading && !isAgeVerified && (
        <AgeVerificationModal
          visible={true}
          onConfirm={confirmAge}
          onDeny={denyAge}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scanButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 12 : 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
});
