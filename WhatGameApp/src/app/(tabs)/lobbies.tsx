import { View, StyleSheet } from "react-native";
import { useState } from "react";
import { Text, Searchbar, useTheme } from "react-native-paper";
export default function Tab() {
  const [searchQuery, setSearchQuery] = useState("");

  const theme = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Searchbar
        placeholder="Search lobbies"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
