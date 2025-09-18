import { useState, useEffect, use } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";
import {
  Text,
  Searchbar,
  SegmentedButtons,
  useTheme,
  Button,
  ActivityIndicator,
  Modal,
  Portal,
  Card,
  TextInput,
  Switch,
  Divider,
  IconButton,
} from "react-native-paper";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LobbyListItem from "components/LobbyListItem";
import EmptyConteiner from "components/EmptyConteiner";

const SEGMENTED_BUTTONS = [
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
];

export default function Tab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("popular");
  const [lobbies, setLobbies] = useState([]);
  const [errors, setErrors] = useState([]);
  const [newLobbyData, setNewLobbyData] = useState({
    name: "",
    max_players: 2,
    friendsOnly: false,
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    getLobbies();
  }, []);

  async function handleLobbyCreate() {
    setIsLoading(true);
    setError(null);

    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/createLobby`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newLobbyData.name,
            filter: newLobbyData.friendsOnly ? "friends" : "public",
            max_players: newLobbyData.max_players,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          console.log("Could not parse error response as JSON.");
        }
        throw new Error(errorMessage);
      }

      // On success, we assume the response is valid JSON
      const json = await response.json();
      setIsEditModalVisible(false);
      setNewLobbyData({ name: "", max_players: 2, friendsOnly: false });
      getLobbies();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function getLobbies() {
    console.log("getting lobbys");
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/getLobbies`,
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
      if (!data["error"]) {
        console.log(data.lobbies);
        setLobbies(data.lobbies);
      } else {
        setErrors(data);
        console.error(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineLarge"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          Discover
        </Text>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search for lobbies"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor={theme.colors.primary}
            inputStyle={{ color: theme.colors.onSurface }}
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.onSurface,
                onSurfaceVariant: theme.colors.onSurfaceVariant,
              },
            }}
          />

          <Button
            mode="contained"
            onPress={() => setIsEditModalVisible(true)}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
            theme={{
              colors: {
                primary: theme.colors.primary,
                onPrimary: theme.colors.onPrimary,
              },
            }}
          >
            <Ionicons
              name="add-outline"
              size={24}
              color={theme.colors.onPrimary}
            />
          </Button>
        </View>
      </View>

      <SegmentedButtons
        value={filterValue}
        onValueChange={setFilterValue}
        style={styles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: theme.colors.surfaceVariant,
            onSecondaryContainer: theme.colors.onSurfaceVariant,
          },
        }}
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

      <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={lobbies}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                {EmptyConteiner("No lobbies found")}
              </View>
            )}
            renderItem={({ item }) => (
              <LobbyListItem lobby={item} key={item.id} />
            )}
            ItemSeparatorComponent={() => <Divider />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Portal>
        <Modal
          visible={isEditModalVisible}
          onDismiss={() => setIsEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Create Lobby"
              titleStyle={[
                styles.modalTitle,
                { color: theme.colors.onPrimaryContainer },
              ]}
              left={(props) => (
                <IconButton
                  {...props}
                  icon="arrow-left"
                  size={24}
                  style={{ margin: 0, marginRight: 8 }}
                  onPress={() => setIsEditModalVisible(false)}
                />
              )}
            />
            <Card.Content style={styles.modalContent}>
              <TextInput
                label="Lobby Name"
                value={newLobbyData.name}
                onChangeText={(text) =>
                  setNewLobbyData((prev) => ({ ...prev, name: text }))
                }
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
              />
              <TextInput
                label="Max Players"
                value={newLobbyData.max_players.toString()}
                onChangeText={(text) =>
                  setNewLobbyData((prev) => ({
                    ...prev,
                    max_players: parseInt(text) || 2,
                  }))
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Friends Only</Text>
                <Switch
                  value={newLobbyData.friendsOnly}
                  onValueChange={(value) =>
                    setNewLobbyData((prev) => ({
                      ...prev,
                      friendsOnly: value,
                    }))
                  }
                />
              </View>
              {error && (
                <Text style={{ color: theme.colors.error, marginTop: 8 }}>
                  {error}
                </Text>
              )}
              <Button
                mode="contained"
                onPress={handleLobbyCreate}
                style={{ marginTop: 16 }}
                disabled={isLoading || !newLobbyData.name.trim()}
                loading={isLoading}
              >
                Create Lobby
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    padding: 16,
    justifyContent: "flex-start",
    marginTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    borderRadius: 12,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalContent: {
    paddingTop: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  toggleLabel: {
    fontSize: 16,
  },
  createButtonLabel: {
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 8,
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
    width: "80%",
    elevation: 0,
  },
  createButton: {
    width: "20%",
    height: 60,
  },
  createButtonContent: {
    width: "100%",
    height: "100%",
  },
  segmentedButtons: {
    marginHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
});
