import { Stack, Slot } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f5843d",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontFamily: "Arial",
        },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
