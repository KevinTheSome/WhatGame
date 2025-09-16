import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// This hook will protect the route access based on authentication status
export function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('token');
      const inAuthGroup = segments[0] === '(auth)';
      const inAppGroup = segments[0] === '(tabs)' || segments[0] === '';

      if (!token && !inAuthGroup) {
        // If the user is not signed in and the initial segment is not in the auth group
        router.replace('/auth');
      } else if (token && inAuthGroup) {
        // If the user is signed in and the initial segment is in the auth group
        router.replace('/(tabs)');
      }
    };

    checkAuth();
  }, [segments]);
}
