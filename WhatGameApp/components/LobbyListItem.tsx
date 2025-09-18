import { View, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { Text, List, Button, useTheme } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";

export default function LobbyListItem(props: any) {
  const theme = useTheme();
  const [lobby, setLobby] = useState(props.lobby);

  return (
    <List.Item
      title={lobby.name}
      right={(props) => (
        <Ionicons name="person-add" size={24} color={theme.colors.onSurface} />
      )}
      onPress={() => {}}
    />
  );
}
