import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Text, Button, Avatar, Card, useTheme } from "react-native-paper";
import { useEffect, useState, useCallback } from "react";
import { useLobby } from "@/hooks/useLobby";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ErrorSnackBar from "components/ErrorSnackBar";
import PlayerListItem from "components/PlayerListItem";

interface User {
      id: string;
      name: string;
}

interface Lobby {
      id: string;
      name: string;
      users: User[];
      state: boolean;
      creator_id: number;
      max_players: number;
}

export default function LobbyTab() {
      const theme = useTheme();
      const insets = useSafeAreaInsets();
      const router = useRouter();
      const navigation = useNavigation();

      const [lobby, setLobby] = useState<Lobby | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [userId, setUserId] = useState<number | null>(null);

      const { players, status, setPlayers, setStatus } = useLobby();

      useEffect(() => {
            async function getUserId() {
                  const user = await SecureStore.getItemAsync("user");
                  if (user) {
                        setUserId(JSON.parse(user).id);
                  }
            }
            getUserId();
      }, []);

      const fetchLobbyInfo = async () => {
            try {
                  const response = await fetch(
                        `${process.env.EXPO_PUBLIC_API_URL}/getLobbyInfo`,
                        {
                              method: "GET",
                              headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                              },
                        },
                  );
                  const data = await response.json();

                  if (data.error) {
                        setLobby(null);
                        setError(data.error);
                        // If user is not in any lobby, navigate to home
                        if (data.error === "Not in any lobby") {
                              // router.replace('/');
                        }
                        return null;
                  }

                  setLobby(data.lobby);
                  setPlayers(
                        data.lobby.users.map((u) => ({
                              id: u.id,
                              name: u.name,
                              ready: false,
                        })),
                  );
                  setStatus(data.lobby.state ? "started" : "waiting");
                  setError(null);
                  setLoading(false);
            } catch (error) {
                  setError(
                        error instanceof Error
                              ? error.message
                              : "An error occurred",
                  );
                  setLoading(false);
            }
      };

      useFocusEffect(
            useCallback(() => {
                  fetchLobbyInfo();
                  return;
            }, []),
      );

      useFocusEffect(
            useCallback(() => {
                  const intervalId = setInterval(fetchLobbyInfo, 2000);

                  return () => clearInterval(intervalId);
            }, []),
      );

      useEffect(() => {
            navigation.setOptions({ headerShown: false });
      }, [navigation]);

      useEffect(() => {
            if (status === "started") {
                  router.push("/voting");
            }
      }, [status, router]);

      const handleLeaveLobby = async () => {
            try {
                  setLoading(true);
                  const response = await fetch(
                        `${process.env.EXPO_PUBLIC_API_URL}/leaveLobby`,
                        {
                              method: "GET",
                              headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                              },
                        },
                  );
                  const data = await response.json();
                  if (data["error"]) {
                        setError(data["error"]);
                  } else {
                        setLoading(false);
                        router.push("/");
                  }
            } catch (error) {
                  console.error(error);
            }
      };

      const handleStartLobby = async () => {
            try {
                  const response = await fetch(
                        `${process.env.EXPO_PUBLIC_API_URL}/startVoting`,
                        {
                              method: "POST",
                              headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                              },
                        },
                  );

                  const data = await response.json();
                  if (data.error) {
                        setError(data.error);
                        return;
                  }
            } catch (error) {
                  console.error("Error starting voting:", error);
                  setError("Network error occurred");
            }
      };

      if (error) {
            return (
                  <View
                        style={[
                              styles.loadingContainer,
                              { backgroundColor: theme.colors.background },
                        ]}
                  >
                        <ErrorSnackBar
                              message={error || ""}
                              type={error ? "error" : "info"}
                              onDismiss={() => setError(null)}
                        />
                  </View>
            );
      }

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
                  style={[
                        styles.container,
                        { backgroundColor: theme.colors.background },
                  ]}
            >
                  <ErrorSnackBar
                        message={error || ""}
                        type={error ? "error" : "info"}
                        onDismiss={() => setError(null)}
                  />
                  <View
                        style={[
                              styles.header,
                              {
                                    paddingTop: insets.top,
                                    paddingBottom: insets.bottom,
                              },
                        ]}
                  >
                        <Text variant="headlineMedium" style={styles.lobbyName}>
                              {lobby?.name}
                        </Text>
                  </View>

                  <View style={styles.playersContainer}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                              {status === "started"
                                    ? "The game has started"
                                    : ""}
                        </Text>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                              Players ({players.length}/{lobby?.max_players})
                        </Text>

                        <FlatList
                              data={players}
                              keyExtractor={(item) => item.id}
                              renderItem={({ item }) => (
                                    <PlayerListItem
                                          name={item.name}
                                          id={item.id}
                                          isHost={
                                                lobby.creator_id ===
                                                Number(item.id)
                                          }
                                    />
                              )}
                              contentContainerStyle={styles.playersList}
                        />
                  </View>

                  <View style={styles.actionsContainer}>
                        <Button
                              mode="outlined"
                              onPress={handleLeaveLobby}
                              style={[styles.button, styles.leaveButton]}
                              labelStyle={styles.buttonLabel}
                              disabled={status === "started"}
                        >
                              Leave Lobby
                        </Button>

                        {lobby.creator_id === Number(userId) && (
                              <Button
                                    mode="contained"
                                    style={[styles.button, styles.startButton]}
                                    labelStyle={styles.buttonLabel}
                                    onPress={handleStartLobby}
                                    disabled={
                                          players.length < 2 ||
                                          status === "started"
                                    }
                              >
                                    Start Voting
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
            marginVertical: 2,
            height: 50,
            justifyContent: "center",
      },
      leaveButton: {
            borderColor: "#ff3b30",
      },
      startButton: {
            borderColor: "#34c759",
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
