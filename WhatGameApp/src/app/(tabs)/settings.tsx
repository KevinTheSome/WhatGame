import { View, StyleSheet, Appearance } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Tab() {
  const theme = useTheme();
  function toggleTheme() {
    Appearance.setColorScheme(
      Appearance.getColorScheme() === "light" ? "dark" : "light"
    );
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("userName");
    await SecureStore.deleteItemAsync("userID");
    await SecureStore.deleteItemAsync("userId");
    await SecureStore.deleteItemAsync("user");
    router.replace("/auth");
  }
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text>Tab Settings</Text>
      <Link href="/auth">login in / sign up</Link>
      <Button onPress={toggleTheme}>Toggle Theme</Button>
      <Button onPress={logout}>Logout</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
