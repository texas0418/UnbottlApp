import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { WineProvider } from "@/contexts/WineContext";
import { BeverageProvider } from "@/contexts/BeverageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { JournalProvider } from "@/contexts/JournalContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { RecommendationsProvider } from "@/contexts/RecommendationsContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="wine/[id]"
        options={{
          presentation: "card",
          headerTitle: "Wine Details",
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
        }}
      />
      <Stack.Screen
        name="wine/add"
        options={{
          presentation: "modal",
          headerTitle: "Add Wine",
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
        }}
      />
      <Stack.Screen
        name="wine/edit/[id]"
        options={{
          presentation: "modal",
          headerTitle: "Edit Wine",
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
        }}
      />
      <Stack.Screen
        name="menu-preview"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="dish-pairing"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="wine-comparison"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="menu-scanner"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="beverage/add"
        options={{
          presentation: "modal",
          headerTitle: "Add Beverage",
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
        }}
      />
      <Stack.Screen
        name="beverage/[category]/[id]"
        options={{
          presentation: "card",
          headerTitle: "Beverage Details",
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
        }}
      />
      <Stack.Screen
        name="csv-import"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="wine-scanner"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="qr-menu"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="customer-menu"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sommelier-chat"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="staff-management"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="restaurant-setup"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pricing"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="wishlist"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="feedback"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestaurantProvider>
          <WineProvider>
            <BeverageProvider>
              <FavoritesProvider>
                <JournalProvider>
                  <ComparisonProvider>
                    <AnalyticsProvider>
                      <RecommendationsProvider>
                        <OfflineProvider>
                          <WishlistProvider>
                            <NotificationsProvider>
                              <GestureHandlerRootView style={{ flex: 1 }}>
                                <StatusBar style="dark" />
                                <RootLayoutNav />
                              </GestureHandlerRootView>
                            </NotificationsProvider>
                          </WishlistProvider>
                        </OfflineProvider>
                      </RecommendationsProvider>
                    </AnalyticsProvider>
                  </ComparisonProvider>
                </JournalProvider>
              </FavoritesProvider>
            </BeverageProvider>
          </WineProvider>
        </RestaurantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
