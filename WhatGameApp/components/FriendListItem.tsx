import { View, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { Text, List, Button, useTheme } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";

export default function FriendListItem(props: any) {
  const theme = useTheme();
  const [friend, setFriend] = useState(props.friend);

  let listItemJSX = null;
  if (props.type === "people") {
    listItemJSX = (
      <List.Item
        title={friend.name}
        right={(props) => (
          <Ionicons
            name="person-add"
            size={24}
            color={theme.colors.onSurface}
          />
        )}
        onPress={() => props.handleAddFriend(friend)}
      />
    );
  } else if (props.type === "friends") {
    listItemJSX = (
      <List.Item
        title={friend.name}
        right={(props) => (
          <Ionicons
            name="person-remove"
            size={24}
            color={theme.colors.onSurface}
          />
        )}
        onPress={() => props.handleRemoveFriend(friend)}
      />
    );
  } else if (props.type === "requests") {
    listItemJSX = (
      <List.Item
        title={friend.name}
        right={(props) => (
          <Ionicons
            name="person-add"
            size={24}
            color={theme.colors.onSurface}
          />
        )}
        onPress={() => props.handleAcceptFriend(friend)}
      />
    );
  }

  return listItemJSX;
}
