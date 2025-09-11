import { View, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect, useRef } from "react";
import {
  Text,
  Searchbar,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import GameCard from "components/GameCard";
import { ScrollView } from "react-native-gesture-handler";

export default function Tab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("browse");
  const [results, setResults] = useState({ results: [] });
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  async function fetchGames() {
    if (searchQuery.trim() === "") {
      setResults({ results: [] });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/search",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ search: searchQuery }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        setResults({ results: [] });
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error(error);
      setResults({ results: [] });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFavGames() {
    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/getUserFavourites",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        setResults({ results: [] });
      } else {
        setResults({ results: data });
      }
    } catch (error) {
      console.error(error);
      setResults({ results: [] });
    } finally {
      setIsLoading(false);
    }
  }

  const timer = useRef<number | null>(null);
  
  useEffect(() => {
    if (filter === "favourite") {
      fetchFavGames();
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    
    if (searchQuery.trim() === "") {
      setResults({ results: [] });
      return;
    }

    timer.current = window.setTimeout(() => {
      fetchGames();
    }, 500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [searchQuery, filter]);

  function JsxGames() {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <Text>Loading...</Text>
        </View>
      );
    }

    if (!results?.results || results.results.length === 0) {
      return (
        <View style={styles.centered}>
          <Text>
            {filter === "favorite"
              ? "No favorites found"
              : searchQuery.trim()
              ? "No games found"
              : "Try searching for a game"}
          </Text>
        </View>
      );
    }

    return results.results.map((game) => (
      <GameCard game={game} key={game.id} />
    ));
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Searchbar
        placeholder="Search for a game"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        style={{ marginVertical: 8 }}
        buttons={[
          {
            value: "browse",
            label: "Browse",
          },
          {
            value: "favourite",
            label: "Favourite",
          },
        ]}
      />
      {/* <GameCard
        game={{
          name: "Monkey game",
          background_image:
            "https://as1.ftcdn.net/v2/jpg/00/51/55/32/1000_F_51553287_9jm0S2CV13BvIsqvqiJCaJAxpX4TzjGy.jpg",
        }}
      /> */}
      {JsxGames()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
