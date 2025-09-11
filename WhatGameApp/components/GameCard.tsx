import { View, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { Text, Card, Button, useTheme } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";

export default function GameCard(props: any) {
  const theme = useTheme();
  const [game, setGame] = useState(props.game);
  const [favorites, setFavorites] = useState(props.game.favorited);

  async function handlefavorites() {
    try {
      setFavorites(!favorites);
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/addToFavourites",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ game_id: game.id }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        setFavorites(favorites);
        console.log(game.id);
      }
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge">{game.name}</Text>
      </Card.Content>
      <Card.Cover source={{ uri: game.background_image }} />
      <Card.Actions>
        <Button onPress={handlefavorites}>
          {favorites ? (
            <Ionicons name="heart" size={24} color="red" />
          ) : (
            <Ionicons name="heart-outline" size={24} color="red" />
          )}
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 2,
  },
});
