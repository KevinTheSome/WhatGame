import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Text } from "react-native";
import { View, FlatList } from "react-native";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar, Button, List, useTheme } from "react-native-paper";
import * as SecureStore from "expo-secure-store";

interface Game {
    name: string;
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

    const renderGameItem = ({ item }: { item: GameItem }) => (
        <List.Item
            title={item.name}
            titleStyle={{
                fontSize: 18,
                fontWeight: "600",
                color: theme.colors.onSurface,
            }}
            description={`${item.votes} votes`}
            descriptionStyle={{ fontSize: 16, color: theme.colors.primary }}
            left={(props) => (
                <List.Icon
                    {...props}
                    icon="vote"
                    color={theme.colors.primary}
                />
            )}
            style={{
                margin: 8,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 8,
            }}
        />
    );

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
            <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
                <Appbar.Content
                    title="Vote Results"
                    titleStyle={{
                        color: theme.colors.onPrimary,
                        fontSize: 20,
                        fontWeight: "bold",
                    }}
                />
                <Button
                    mode="contained"
                    onPress={leaveVoting}
                    style={{
                        backgroundColor: theme.colors.error,
                        marginRight: 8,
                    }}
                    contentStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
                    labelStyle={{
                        color: theme.colors.onError,
                        fontWeight: "600",
                    }}
                >
                    Leave
                </Button>
            </Appbar.Header>
            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : error ? (
                <Text style={{ color: theme.colors.error, margin: 16 }}>
                    {error}
                </Text>
            ) : (
                <FlatList
                    data={games}
                    renderItem={renderGameItem}
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
