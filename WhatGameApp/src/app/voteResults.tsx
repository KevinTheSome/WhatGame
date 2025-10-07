import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { View, FlatList } from "react-native";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import GameItem from "../../components/GameItem";

interface Game {
    name: string;
    background_image: string | null;
    votes: number;
    upvotes: number;
    downvotes: number;
}

interface PlayerVotes {
    [playerId: string]: {
        [gameId: string]: number;
    };
}

interface PlayersFavoriteGames {
    [playerId: string]: string[];
}

interface GameResultsResponse {
    success: boolean;
    lobby_id: string;
    games: { [id: string]: Game };
    players_favorite_games: PlayersFavoriteGames;
    total_votes_cast: number;
    total_players: number;
    player_votes: PlayerVotes;
}

interface GameItem {
    id: string;
    background_image: string | null;
    name: string;
    votes: number;
}

export default function VoteResults() {
    const router = useRouter();
    const theme = useTheme();
    const navigation = useNavigation();
    const [games, setGames] = useState<GameItem[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const leaveVoting = async () => {
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

    const getGameResults = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/voteResult`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                    },
                },
            );
            const data: GameResultsResponse & { error?: string } =
                await response.json();
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                const gameItems: GameItem[] = Object.entries(data.games).map(
                    ([id, game]) => ({
                        id,
                        name: game.name,
                        votes: game.votes,
                        background_image: game.background_image,
                    }),
                );
                setGames(gameItems);
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            getGameResults();
        }, []),
    );

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
            <Text
                variant="headlineLarge"
                style={[styles.title, { color: theme.colors.onBackground }]}
            >
                Results
            </Text>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : error ? (
                <Text style={{ color: theme.colors.error, margin: 16 }}>
                    {error}
                </Text>
            ) : (
                <FlatList
                    data={games}
                    renderItem={({ item }) => <GameItem item={item} />}
                    keyExtractor={(item) => item.id}
                    style={{
                        flex: 1,
                        backgroundColor: theme.colors.background,
                    }}
                />
            )}
        </SafeAreaView>
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
