import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function EmptyConteiner(emptyString: String) {
  return (
    <View style={styles.emptyContainer}>
      <Text>{emptyString}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    marginTop: 50,
    alignItems: "center",
  },
});
