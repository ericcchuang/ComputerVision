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
      initialRouteName="index"
    >
      <Slot />
    </Stack>
  );
}
