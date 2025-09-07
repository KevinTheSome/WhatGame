import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "react-native-paper";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const theme = useTheme();
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
        name="lobbies"
        options={{
          title: "Lobbies",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name="people-circle" color={color} />
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
