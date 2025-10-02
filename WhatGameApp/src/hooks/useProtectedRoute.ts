import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";

// This hook will protect the route access based on authentication status
export function useProtectedRoute() {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = await SecureStore.getItemAsync("token");
            const inAuthGroup = segments[0] === "auth";

            if (!token && !inAuthGroup) {
                router.replace("/auth");
            } else if (token && inAuthGroup) {
                router.replace("/(tabs)");
            }
        };

        checkAuth();
    }, [segments]);
}
