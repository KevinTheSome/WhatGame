import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  Text,
  Searchbar,
  useTheme,
  Avatar,
  Divider,
  Button,
  SegmentedButtons,
  ActivityIndicator,
} from "react-native-paper";
import * as SecureStore from "expo-secure-store";

type Friend = {
  id: string;
  name: string;
  requestStatus?: "pending" | "accepted";
};

export default function FriendsTab() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    }
  }, [activeTab]);

  async function fetchFriends() {
    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/getFriends",
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
        setFriends([]);
      } else {
        setFriends(data.results);
      }
    } catch (error) {
      console.error(error);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/peopleSearch",
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
        setResults([]);
      } else {
        setResults(data.results);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function removeFriend(friend: Friend) {
    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/delFriend",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ friends_id: friend.id }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        console.error(data["error"]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab === "favourite") {
      fetchFriends();
      return;
    }

    if (timer.current) clearTimeout(timer.current);

    if (searchQuery.trim() === "") {
      setResults([]);
      return;
    }

    timer.current = window.setTimeout(() => {
      handleSearch();
    }, 500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [searchQuery]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Searchbar
        placeholder="Search for people"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "friends" | "requests")}
        style={{ marginVertical: 8 }}
        buttons={[
          {
            value: "friends",
            label: "Friends",
            icon: "account-group",
          },
          {
            value: "requests",
            label: "Requests",
            icon: "account-clock",
          },
        ]}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={activeTab === "friends" ? friends : results}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity onPress={() => removeFriend(item)}>
                <Text style={styles.friendName}>{item.name}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  friendName: {
    fontSize: 16,
  },
});
