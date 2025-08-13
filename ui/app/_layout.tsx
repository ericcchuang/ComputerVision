import { Stack, Slot } from "expo-router";
import HomeScreen from "./index";

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
      <HomeScreen />
    </Stack>
  );
}
