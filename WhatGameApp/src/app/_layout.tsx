import "../global.css";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { Colors } from "constants/Colors";
import * as SecureStore from "expo-secure-store";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const theme =
    colorScheme === "dark"
      ? { ...MD3DarkTheme, colors: Colors.dark }
      : { ...MD3LightTheme, colors: Colors.light };

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primaryContainer,
              },
              headerTintColor: theme.colors.primaryContainer,
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </GestureHandlerRootView>
    </>
  );
}
