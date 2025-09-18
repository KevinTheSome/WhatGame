import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Text, Button, Avatar, Card, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
  id: string;
  name: string;
}

interface Lobby {
  id: string;
  name: string;
  users: User[];
  state: "waiting" | "started";
  current_question?: string;
  max_players: number;
}

export default function LobbyTab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchLobbyInfo = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/getLobbyInfo`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await SecureStore.getItemAsync(
                "token"
              )}`,
            },
          }
        );
        const data = await response.json();
        if (data["error"] != null) {
          console.error(data["error"]);
          setLobby(null);
          router.back();
          return;
        }
        console.log(data);
        setLobby(data.lobby);
        // setIsHost(data.lobby.users[0].id === data.user.id);
      } catch (error) {
        console.error("Error fetching lobby info:", error);
      }
    };
    fetchLobbyInfo();
  }, []);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleVote = (vote: string) => {
    if (!lobby || !currentUser) return;

    setSelectedVote(vote);
  };

  const handleNextGame = () => {};

  const handleLeaveLobby = async () => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/leaveLobby`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
        },
        body: JSON.stringify({
          lobby_id: lobby.id,
        }),
      }
    );
    await SecureStore.deleteItemAsync("currentLobby");
    router.back();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text variant="headlineMedium" style={styles.lobbyName}>
          {lobby?.name}
        </Text>
      </View>

      <View style={styles.playersContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Players ({1}/{2})
        </Text>

        {/* <FlatList
          data={lobby.users}
          keyExtractor={(item) => `user-${item.id}`}
          renderItem={({ item }) => (
            <View
              style={[
                styles.playerItem,
                item.id === currentUser.id && styles.currentPlayerItem,
              ]}
            >
              <Avatar.Text size={48} label={item.name[0].toUpperCase()} />
              <Text style={styles.playerName}>
                {item.name} {item.id === currentUser.id && "(You)"}
              </Text>
              {isHost && item.id === currentUser?.id && (
                <Text style={styles.hostBadge}>Host</Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.playersList}
        /> */}
      </View>

      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={handleLeaveLobby}
          style={[styles.button, styles.leaveButton]}
          labelStyle={styles.buttonLabel}
        >
          Leave Lobby
        </Button>

        {isHost && (
          <Button
            mode="contained"
            onPress={handleNextGame}
            style={[styles.button, styles.startButton]}
            labelStyle={styles.buttonLabel}
            disabled={lobby.users.length < 2}
          >
            Start Game
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  lobbyName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  lobbyCode: {
    color: "#666",
    fontSize: 16,
  },
  playersContainer: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  playersList: {
    paddingBottom: 16,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentPlayerItem: {
    borderWidth: 1,
    borderColor: "#6200ee",
  },
  playerName: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  hostBadge: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    color: "#333",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    height: 50,
    justifyContent: "center",
  },
  leaveButton: {
    borderColor: "#ff3b30",
  },
  startButton: {
    backgroundColor: "#34c759",
  },
  buttonLabel: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
