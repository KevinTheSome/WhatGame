import {
    View,
    StyleSheet,
    PanResponder,
    Animated,
    Dimensions,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRef } from "react";
import { ImageBackground } from "react-native";

interface GameInfo {
    id: number;
    info: {
        name: string;
        background_image: string;
    };
    game_id: number;
}

interface AnswerCardProps {
    game: GameInfo;
    onSwipe: (direction: "like" | "dislike") => void;
    onSwipeComplete: () => void;
    isActive?: boolean;
}

const AnswerCard = ({
    game,
    onSwipe,
    onSwipeComplete,
    isActive = true,
}: AnswerCardProps) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const likeOpacity = useRef(new Animated.Value(0)).current;
    const dislikeOpacity = useRef(new Animated.Value(0)).current;
    const theme = useTheme();

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            pan.setValue({ x: gestureState.dx, y: 0 });

            if (gestureState.dx > 0) {
                likeOpacity.setValue(Math.min(gestureState.dx / 100, 0.5));
                dislikeOpacity.setValue(0);
            } else if (gestureState.dx < 0) {
                dislikeOpacity.setValue(
                    Math.min(Math.abs(gestureState.dx) / 100, 0.5),
                );
                likeOpacity.setValue(0);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (Math.abs(gestureState.dx) > 50) {
                const direction = gestureState.dx > 0 ? "like" : "dislike";
                const targetX = gestureState.dx * 2;
                Animated.parallel([
                    Animated.timing(pan, {
                        toValue: { x: targetX, y: 0 },
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start(() => {
                    onSwipe(direction);
                    onSwipeComplete();
                });
            } else {
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    friction: 5,
                    useNativeDriver: false,
                }).start();

                Animated.parallel([
                    Animated.timing(likeOpacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.timing(dislikeOpacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start();
            }
        },
    });

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    opacity: opacity,
                    zIndex: isActive ? 10 : 5,
                },
            ]}
            {...(isActive ? panResponder.panHandlers : {})}
        >
            <ImageBackground
                source={{ uri: game?.info?.background_image || "" }}
                style={styles.backgroundImage}
                blurRadius={3}
            >
                <View style={styles.overlay}>
                    <Text style={styles.gameName}>
                        {game?.info?.name || "Unknown Game"}
                    </Text>
                </View>
            </ImageBackground>

            <Animated.View
                style={[styles.likeIndicator, { opacity: likeOpacity }]}
            >
                <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            <Animated.View
                style={[styles.dislikeIndicator, { opacity: dislikeOpacity }]}
            >
                <Text style={styles.dislikeText}>NOPE</Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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
    backgroundImage: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    gameName: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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
});

export default AnswerCard;
