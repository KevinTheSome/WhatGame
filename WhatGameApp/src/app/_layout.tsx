import "../global.css";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect } from "react";
import { PaperProvider } from "react-native-paper";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();

  // useEffect(() => {
  //   const inAuthGroup = segments[0] === "auth";

  //   if (!inAuthGroup) {
  //     router.replace("/auth");
  //   } else if (inAuthGroup) {
  //     router.replace("/");
  //   }
  // }, [segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <RouteGuard>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </RouteGuard>
        </PaperProvider>
      </GestureHandlerRootView>
    </>
  );
}
