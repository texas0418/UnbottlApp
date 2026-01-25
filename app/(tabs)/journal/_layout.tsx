import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Wine Journal",
        }}
      />
    </Stack>
  );
}
