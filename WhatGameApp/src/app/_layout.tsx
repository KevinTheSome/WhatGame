import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { Colors } from "../../constants/Colors";
import { AuthProvider } from "../contexts/AuthContext";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import { ThemeProvider, useThemeContext } from "../contexts/ThemeContext";

// This component wraps the app with the auth provider
function RootLayoutNav() {
    const { effectiveColorScheme } = useThemeContext();

    // This will handle redirecting the user based on auth state
    useProtectedRoute();

    const theme =
        effectiveColorScheme === "dark"
            ? { ...MD3DarkTheme, colors: Colors.dark }
            : { ...MD3LightTheme, colors: Colors.light };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <Stack
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: theme.colors.primaryContainer,
                        },
                        headerTintColor: theme.colors.onPrimaryContainer,
                        headerTitleStyle: {
                            fontWeight: "bold",
                        },
                    }}
                >
                    <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="auth"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                    />
                </Stack>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <RootLayoutNav />
            </AuthProvider>
        </ThemeProvider>
    );
}
