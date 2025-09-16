import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  Divider,
  Searchbar,
  useTheme,
  SegmentedButtons,
  ActivityIndicator,
} from "react-native-paper";
import FriendListItem from "components/FriendListItem";
import EmptyConteiner from "components/EmptyConteiner";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

export default function FriendsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "people">(
    "friends"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [people, setPeople] = useState([]);
  const [requests, setrequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    }
  }, [activeTab]);

  async function addFriend(friend: any) {
    console.log("friend id: " + friend.id);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/addFriend",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ friend_id: friend.id }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        console.error(data["error"]);
        console.error(data["errorMessage"]);
      } else {
        fetchRequests(); // Refresh the requests list
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function acceptFriend(friend: any) {
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/acceptFriend",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ friend_id: friend.id }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        console.error(data["error"]);
      } else {
        fetchFriends(); // Refresh the friends list
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function removeFriend(friend: any) {
    console.log("friend id: " + friend.id);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/removeFriend",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
          body: JSON.stringify({ friend_id: friend.id }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        console.error(data["error"]);
      } else {
        fetchFriends(); // Refresh the friends list
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchRequests() {
    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/getPending",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        setrequests([]);
      } else {
        console.log("requests data: ");
        console.log(data);
        setrequests(data);
      }
    } catch (error) {
      console.error(error);
      setrequests([]);
    } finally {
      setIsLoading(false);
    }
  }

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
          body: JSON.stringify({ search: searchQuery || "" }),
        }
      );
      const data = await response.json();
      if (data["error"] != null) {
        setFriends([]);
      } else {
        console.log("friends data: ");
        console.log(data);
        setFriends(data);
      }
    } catch (error) {
      console.error(error);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function getPeople() {
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
        setPeople([]);
      } else {
        console.log("people data: ");
        console.log(data);
        setPeople(data);
      }
    } catch (error) {
      console.error(error);
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }

  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
      return;
    }

    if (activeTab === "people") {
      if (timer.current) clearTimeout(timer.current);

      timer.current = window.setTimeout(() => {
        getPeople();
      }, 500);

      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    if (activeTab === "requests") {
      fetchRequests();
      return;
    }
  }, [activeTab, searchQuery]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <Searchbar
        placeholder="Search for people"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "friends" | "requests" | "people")
        }
        style={{ marginVertical: 8 }}
        buttons={[
          { value: "friends", label: "Friends", icon: "account-group" },
          { value: "people", label: "People", icon: "account-search" },
          { value: "requests", label: "Requests", icon: "account-clock" },
        ]}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={
            activeTab === "friends"
              ? friends
              : activeTab === "requests"
              ? requests
              : people
          }
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() =>
            EmptyConteiner("Nothing found for " + activeTab)
          }
          renderItem={({ item }) => (
            <FriendListItem
              friend={item}
              type={activeTab}
              key={item.id}
              handleAddFriend={addFriend}
              handleRemoveFriend={removeFriend}
              handleAcceptFriend={acceptFriend}
            />
          )}
          ItemSeparatorComponent={() => <Divider />}
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
  emptyContainer: {
    flex: 1,
    marginTop: 50,
    alignItems: "center",
  },
  friendName: {
    fontSize: 16,
  },
});
