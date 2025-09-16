import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Searchbar,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Tab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // State for the search bar and segmented buttons
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("popular");

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    // Use a ScrollView to allow content to scroll if the screen is small
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      // This ensures the padding respects the safe area
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Discover
        </Text>
        <Searchbar
          placeholder="Search for items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <SegmentedButtons
        value={filterValue}
        onValueChange={setFilterValue}
        style={styles.segmentedButtons}
        buttons={[
          {
            value: "popular",
            label: "Popular",
            icon: "fire",
          },
          {
            value: "newest",
            label: "Newest",
            icon: "new-box",
          },
          {
            value: "following",
            label: "Following",
            icon: "account-heart-outline",
          },
        ]}
      />

      {/* --- Main Content Area --- */}
      {/* You can add your list of items (e.g., a FlatList) here */}
      <View style={styles.contentArea}>
        <Text>Your main content goes here.</Text>
        <Text>Current filter: {filterValue}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginHorizontal: 20,
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40, // Add some space for demonstration
  },
});
