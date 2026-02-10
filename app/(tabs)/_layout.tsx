import { Tabs } from "expo-router";
import { Home, Compass, ScanLine, BookOpen, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import Colors from "@/constants/colors";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import { useAgeVerification } from "@/hooks/useAgeVerification";

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
              android: {
                elevation: 8,
              },
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
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: "Discover",
            tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: "Scan",
            tabBarIcon: ({ color, size }) => <ScanLine size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
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
