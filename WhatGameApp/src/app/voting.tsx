import {
    View,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { Text, useTheme, IconButton } from "react-native-paper";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { use, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import AnswerCard from "../../components/AnswerCard";

export default function VotingView() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const navigation = useNavigation();

    const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [displayedCards, setDisplayedCards] = useState([0, 1]);
    const [error, setError] = useState<string | null>(null);
    const [games, setGames] = useState<
        { game_id: string; name: string }[] | null
    >(null);
    const [currentGame, setCurrentGame] = useState<{
        game_id: string;
        name: string;
    } | null>(null);
    const [doneVoting, setDoneVoting] = useState(false);

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            getGamesToVoteOn();
            return;
        }, []),
    );

    useEffect(() => {
        if (doneVoting) {
            router.push("/voteResults");
        }
    }, [doneVoting]);

    useEffect(() => {
        if (games && currentAnswerIndex >= games.length) {
            setDoneVoting(true);
        }
    }, [currentAnswerIndex, games]);

    const getGamesToVoteOn = async () => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/getVoteGames`,
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
                setGames(data["games"]);
                setError(null);
                setLoading(false);
            }
        } catch (error) {
            setError("Failed to fetch lobby info");
            console.error(error);
        }
    };
    const sendVote = async (vote: "like" | "dislike") => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/postVote`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                    },
                    body: JSON.stringify({
                        game_id: games?.[currentAnswerIndex].game_id,
                        vote: vote === "like" ? 1 : -1,
                    }),
                },
            );
            const data = await response.json();
            if (data["error"]) {
                setError(data["error"]);
            } else {
                setError(null);
                setLoading(false);
            }
        } catch (error) {
            setError("Failed to fetch lobby info");
            console.error(error);
        }
    };

    const handleVote = (vote: "like" | "dislike") => {
        sendVote(vote);
        goToNextAnswer();
    };

    const handleSwipe = (direction: "like" | "dislike") => {
        handleVote(direction);
    };

    const goToNextAnswer = () => {
        if (games && currentAnswerIndex < games.length) {
            const nextIndex = currentAnswerIndex + 1;
            // Update the current index first
            setCurrentAnswerIndex(nextIndex);

            // Then update the displayed cards to include the next one in the stack
            if (nextIndex + 1 < games.length) {
                setDisplayedCards([nextIndex, nextIndex + 1]);
            } else if (nextIndex < games.length) {
                setDisplayedCards([nextIndex]);
            } else {
                setDisplayedCards([]);
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

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
            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Vote on Games
                </Text>

                <View
                    style={[
                        styles.cardContainer,
                        { backgroundColor: theme.colors.background },
                    ]}
                >
                    {!loading && games && currentAnswerIndex < games.length ? (
                        <>
                            {displayedCards
                                .map((index) => (
                                    <AnswerCard
                                        key={index}
                                        game={games[index] as any}
                                        onSwipe={handleSwipe}
                                        onSwipeComplete={goToNextAnswer}
                                        isActive={index === currentAnswerIndex}
                                    />
                                ))
                                .reverse()}
                        </>
                    ) : (
                        <Text style={styles.noMoreText}>
                            No more games to vote on!
                        </Text>
                    )}
                </View>

                <View
                    style={[
                        styles.buttonsContainer,
                        { backgroundColor: theme.colors.background },
                    ]}
                >
                    <IconButton
                        icon="close"
                        iconColor="#F44336"
                        size={40}
                        onPress={() => handleVote("dislike")}
                        style={[
                            styles.button,
                            styles.dislikeButton,
                            { backgroundColor: theme.colors.background },
                        ]}
                        disabled={
                            games ? currentAnswerIndex >= games.length : true
                        }
                    />
                    <IconButton
                        icon="heart"
                        iconColor="#4CAF50"
                        size={40}
                        onPress={() => handleVote("like")}
                        style={[
                            styles.button,
                            styles.likeButton,
                            { backgroundColor: theme.colors.background },
                        ]}
                        disabled={
                            games ? currentAnswerIndex >= games.length : true
                        }
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: "center",
        padding: 20,
    },
    title: {
        marginBottom: 30,
        textAlign: "center",
    },
    cardContainer: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        width: "90%",
        height: 200,
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: "absolute",
        zIndex: 1,
    },
    answerText: {
        fontSize: 18,
        textAlign: "center",
    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        padding: 20,
    },
    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "white",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    likeButton: {
        borderColor: "#4CAF50",
        borderWidth: 2,
    },
    dislikeButton: {
        borderColor: "#F44336",
        borderWidth: 2,
    },
    likeIndicator: {
        position: "absolute",
        left: 20,
        top: 20,
        borderColor: "#4CAF50",
        borderWidth: 2,
        padding: 5,
        borderRadius: 5,
        transform: [{ rotate: "-15deg" }],
    },
    dislikeIndicator: {
        position: "absolute",
        right: 20,
        top: 20,
        borderColor: "#F44336",
        borderWidth: 2,
        padding: 5,
        borderRadius: 5,
        transform: [{ rotate: "15deg" }],
    },
    likeText: {
        color: "#4CAF50",
        fontWeight: "bold",
        fontSize: 16,
    },
    dislikeText: {
        color: "#F44336",
        fontWeight: "bold",
        fontSize: 16,
    },
    noMoreText: {
        fontSize: 18,
        textAlign: "center",
        marginVertical: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
