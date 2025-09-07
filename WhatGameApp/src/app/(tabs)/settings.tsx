import { View, StyleSheet, Appearance } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { Link } from "expo-router";

export default function Tab() {
  const theme = useTheme();
  function toggleTheme() {
    Appearance.setColorScheme(
      Appearance.getColorScheme() === "light" ? "dark" : "light"
    );
  }
  return (
    <View style={styles.container}>
      <Text>Tab Settings</Text>
      <Link href="/auth">login in / sign up</Link>
      <Button onPress={toggleTheme}>Toggle Theme</Button>
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
