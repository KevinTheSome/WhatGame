import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useState, useEffect, useRef } from "react";
import ErrorSnackBar from "components/ErrorSnackBar";
import {
    Divider,
    Searchbar,
    useTheme,
    SegmentedButtons,
    ActivityIndicator,
    Text,
} from "react-native-paper";
import FriendListItem from "components/FriendListItem";
import EmptyConteiner from "components/EmptyConteiner";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

export default function FriendsTab() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<
        "friends" | "requests" | "people"
    >("friends");
    const [isLoading, setIsLoading] = useState(false);
    const [people, setPeople] = useState([]);
    const [requests, setrequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState<string | null>(null);
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
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setError(data["errorMessage"] || data["error"]);
            } else {
                fetchRequests(); // Refresh the requests list
                setError(null);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while adding friend";
            setError(errorMessage);
            console.error(errorMessage);
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
                },
            );
            const data = await response.json();
            if (data["error"]) {
                const errorMessage =
                    data["errorMessage"] ||
                    data["error"] ||
                    "Failed to accept friend request";
                setError(errorMessage);
                console.error(errorMessage);
            } else {
                fetchFriends(); // Refresh the friends list
                setError(null);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while accepting friend request";
            setError(errorMessage);
            console.error(errorMessage);
        }
    }

    async function removeFriend(friend: any) {
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
                },
            );
            const data = await response.json();
            if (data["error"]) {
                const errorMessage =
                    data["errorMessage"] ||
                    data["error"] ||
                    "Failed to remove friend";
                setError(errorMessage);
                console.error(errorMessage);
            } else {
                fetchFriends(); // Refresh the friends list
                setError(null);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while removing friend";
            setError(errorMessage);
            console.error(errorMessage);
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
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setError(data["error"]);
                setrequests([]);
            } else {
                setrequests(data);
                setError(null);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch friend requests";
            setError(errorMessage);
            console.error(errorMessage);
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
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setError(data["error"]);
                setFriends([]);
            } else {
                setFriends(data);
                setError(null);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch friends";
            setError(errorMessage);
            console.error(errorMessage);
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
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setError(data["error"]);
                console.error(data["errorMessage"]);
                setPeople([]);
            } else {
                setPeople(data);
                setError(null);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to search for people";
            setError(errorMessage);
            console.error(errorMessage);
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
        }
    }, [activeTab, searchQuery]);

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.background,
                    paddingTop: insets.top,
                },
            ]}
        >
            <ErrorSnackBar
                message={error || ""}
                type={error ? "error" : "info"}
                onDismiss={() => setError(null)}
            />
            <View style={styles.header}>
                <Text
                    variant="headlineLarge"
                    style={[styles.title, { color: theme.colors.onBackground }]}
                >
                    Friends
                </Text>
                <Searchbar
                    placeholder="Search for people"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={{ marginBottom: 16 }}
                />

                <SegmentedButtons
                    value={activeTab}
                    onValueChange={(value) =>
                        setActiveTab(value as "friends" | "requests" | "people")
                    }
                    style={{ marginBottom: 16 }}
                    buttons={[
                        {
                            value: "friends",
                            label: "Friends",
                            icon: "account-group",
                        },
                        {
                            value: "people",
                            label: "People",
                            icon: "account-search",
                        },
                        {
                            value: "requests",
                            label: "Requests",
                            icon: "account-clock",
                        },
                    ]}
                />
            </View>

            <View style={styles.content}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 16,
    },
    header: {
        marginBottom: 16,
    },
    content: {
        flex: 1,
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
