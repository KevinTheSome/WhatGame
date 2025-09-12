import { View, StyleSheet, Appearance } from "react-native";
import { useState } from "react";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Tab() {
  const theme = useTheme();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  async function delUser() {
    if (password == "") {
      setError("Passwords must be filled.");
      return;
    }
    if (password.length < 7) {
      setError("Passwords must be at least 8 characters long.");
      return;
    }
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/delUser",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ user_pass: password }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        setError(data["error"]);
        return;
      }

      setError("");
      logout();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Button onPress={toggleTheme}>Toggle Theme</Button>
      <Text>User Settings</Text>
      <Button onPress={() => router.push("/auth")}>Login / Register</Button>
      <Button onPress={logout}>Logout</Button>
      <TextInput
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
      />
      <Text style={{ color: theme.colors.error }}>{error}</Text>
      <Button onPress={() => delUser()}>Delete User</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
