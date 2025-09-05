import { View, Text, StyleSheet } from "react-native";

import { Link } from "expo-router";

export default function Tab() {
  return (
    <View style={styles.container}>
      <Text>Tab Settings</Text>
      <Link href="/auth">login in / sign up</Link>
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
