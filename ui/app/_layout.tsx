import { Stack } from "expo-router";
import Constants from "expo-constants";

export const unstable_settings = {
  basePath: Constants.expoConfig?.extra?.routerBasePath || "/",
};

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
      \\    </Stack>
  );
}
