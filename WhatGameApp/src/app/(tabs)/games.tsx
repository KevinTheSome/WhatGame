import { View, StyleSheet, FlatList } from "react-native";
import { useNavigation, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    Text,
    Searchbar,
    SegmentedButtons,
    useTheme,
    ActivityIndicator,
} from "react-native-paper";
import GameCard from "components/GameCard";
import { ScrollView } from "react-native-gesture-handler";
import ErrorSnackBar from "components/ErrorSnackBar";

export default function Tab() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<string>("browse");
    const [results, setResults] = useState({ results: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allFavourites, setAllFavourites] = useState([]);
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        if (filter === "favourite") {
            fetchAllFavourites();
        }
    }, [filter]);

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
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setError(data["error"]);
                setResults({ results: [] });
            } else {
                setResults(data);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while fetching games";
            setError(errorMessage);
            console.error(errorMessage);
            setResults({ results: [] });
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchAllFavourites() {
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
                    body: JSON.stringify({ search: "" }),
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setError(data["error"]);
                setAllFavourites([]);
                setResults({ results: [] });
            } else {
                if (JSON.stringify(data) !== JSON.stringify(allFavourites)) {
                    setAllFavourites(data);
                }
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while fetching favourite games";
            setError(errorMessage);
            console.error(errorMessage);
            setAllFavourites([]);
            setResults({ results: [] });
        } finally {
            setIsLoading(false);
        }
    }

    const filterFavourites = (query: string) => {
        if (!allFavourites || allFavourites.length === 0) {
            return [];
        }
        if (!query.trim()) {
            return allFavourites;
        }
        const lowerQuery = query.toLowerCase();
        return allFavourites.filter(
            (game) => game.name && game.name.toLowerCase().includes(lowerQuery),
        );
    };

    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (filter !== "favourite") {
            if (timer.current) {
                clearTimeout(timer.current);
            }

            if (searchQuery.trim() === "") {
                setResults({ results: [] });
                return;
            }

            timer.current = setTimeout(() => {
                fetchGames();
            }, 500);

            return () => {
                if (timer.current) {
                    clearTimeout(timer.current);
                }
            };
        }
    }, [searchQuery, filter]);

    useEffect(() => {
        if (filter === "favourite") {
            if (allFavourites.length === 0) {
                fetchAllFavourites();
            } else {
                const filtered = filterFavourites(searchQuery);
                setResults({ results: filtered });
                setIsLoading(false);
            }
        }
    }, [filter, searchQuery, allFavourites]);

    return (
        <>
            <ErrorSnackBar
                message={error || ""}
                type={error ? "error" : "info"}
                onDismiss={() => setError(null)}
            />
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: theme.colors.background,
                        paddingTop: insets.top,
                    },
                ]}
            >
                <Text
                    variant="headlineLarge"
                    style={[styles.title, { color: theme.colors.onBackground }]}
                >
                    Games
                </Text>
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
                            icon: "magnify",
                        },
                        {
                            value: "favourite",
                            label: "Favourite",
                            icon: "heart",
                        },
                    ]}
                />
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={results.results}
                        renderItem={({ item }) => (
                            <GameCard
                                game={item}
                                key={item.id}
                                onFavorite={() => fetchAllFavourites()}
                            />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={() => {
                            let message;
                            if (filter === "favourite") {
                                message =
                                    searchQuery.trim() === ""
                                        ? "No favourites found"
                                        : "No matching favourites found";
                            } else {
                                message =
                                    searchQuery.trim() === ""
                                        ? "Try searching for a game"
                                        : "No games found";
                            }
                            return (
                                <View style={styles.centered}>
                                    <Text>{message}</Text>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </>
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
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
