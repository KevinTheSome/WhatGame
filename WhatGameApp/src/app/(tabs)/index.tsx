import { View, StyleSheet } from "react-native";
import {
  Text,
  Searchbar,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";

export default function Tab() {
  const theme = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text>Tab Home</Text>
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
