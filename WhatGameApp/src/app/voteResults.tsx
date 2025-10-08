import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { View, FlatList } from "react-native";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    const insets = useSafeAreaInsets();
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
                const gameItems: GameItem[] = Object.entries(data.games)
                    .map(([id, game]) => ({
                        id,
                        name: game.name,
                        votes: game.votes,
                        background_image: game.background_image,
                    }))
                    .sort((a, b) => b.votes - a.votes);
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
            style={{
                flex: 1,
                backgroundColor: theme.colors.background,
            }}
        >
            <View style={styles.header}>
                <Text
                    variant="headlineLarge"
                    style={[styles.title, { color: theme.colors.onBackground }]}
                >
                    Results
                </Text>
                <Button
                    mode="outlined"
                    onPress={leaveVoting}
                    style={[styles.button]}
                    labelStyle={styles.buttonLabel}
                >
                    Leave Lobby
                </Button>
            </View>

            {loading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" />
                </View>
            ) : error ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: theme.colors.error }}>{error}</Text>
                </View>
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
    title: {
        fontWeight: "bold",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    button: {
        height: 50,
        justifyContent: "center",
    },
    buttonLabel: {
        fontSize: 16,
    },
});
