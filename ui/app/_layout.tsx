import { Stack, Slot } from "expo-router";
import { BrowserRouter } from "react-router-dom";

export default function RootLayout() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL || "/"}>
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
    </BrowserRouter>
  );
}
