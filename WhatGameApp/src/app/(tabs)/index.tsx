import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";
import {
  Text,
  Searchbar,
  SegmentedButtons,
  useTheme,
  Button,
  Modal,
  Portal,
  Card,
  TextInput,
  Switch,
  IconButton,
} from "react-native-paper";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Tab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("popular");
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
      // TODO: You might want to refresh the lobby list here

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Discover
        </Text>
        <View style={{ flexDirection: "row", flex: 1 }}>
          <Searchbar
            placeholder="Search for items..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { width: "80%", marginRight: 8 }]}
          />
          <Button
            mode="contained"
            onPress={() => {
              setIsEditModalVisible(true);
            }}
            style={{
              width: "20%",
              height: 60,
              alignContent: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary,
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

      
      <View style={styles.contentArea}>
        <Text>Your main content goes here.</Text>
        <Text>Current filter: {filterValue}</Text>
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
              titleStyle={[styles.modalTitle, { color: theme.colors.onPrimaryContainer }]}
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
              {error && <Text style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    padding: 16,
    justifyContent: 'flex-start',
    marginTop: 60,
  },
  modalCard: {
    borderRadius: 12,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    paddingTop: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  toggleLabel: {
    fontSize: 16,
  },
  createButton: {
    marginTop: 8,
    paddingVertical: 6,
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
  searchbar: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginHorizontal: 20,
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40, // Add some space for demonstration
  },
});
