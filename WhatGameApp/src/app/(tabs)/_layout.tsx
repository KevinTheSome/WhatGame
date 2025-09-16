import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "react-native-paper";
import { Slot, Stack, useRouter, useSegments, Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";

export default function TabLayout() {
  const theme = useTheme();

  // async function RouteGuard({ children }: { children: React.ReactNode }) {
  //   const router = useRouter();
  //   const segments = useSegments();
  //   const token = await SecureStore.getItemAsync("token");
  //   useEffect(() => {
  //     if (token == null || token == undefined || token == "") {
  //       router.replace("/auth");
  //     }
  //   }, [segments, token]);

  //   return <>{children}</>;
  // }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.onPrimaryContainer,
        tabBarInactiveTintColor: theme.colors.onSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.colors.onPrimaryContainer,
          borderTopColor: theme.colors.onPrimaryContainer,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="game-controller" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name="person" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
