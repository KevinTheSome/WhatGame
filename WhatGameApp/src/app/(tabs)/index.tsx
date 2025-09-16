import { View, StyleSheet } from "react-native";
import {
  Text,
  Searchbar,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Tab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <Text style={{ color: theme.colors.onPrimaryContainer }}>Home</Text>
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
