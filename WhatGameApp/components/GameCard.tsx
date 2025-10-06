import { View, StyleSheet, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { Text, Card, IconButton, useTheme } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";

export default function GameCard(props: any) {
    const theme = useTheme();
    const [game, setGame] = useState(props.game);
    const [favorites, setFavorites] = useState(props.game.favorited);

    async function handlefavorites() {
        try {
            setFavorites(!favorites);
            const response = await fetch(
                process.env.EXPO_PUBLIC_API_URL + "/addToFavourites",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                    },
                    body: JSON.stringify({ game_id: game.id }),
                },
            );
            const data = await response.json();
            if (data["error"] != null) {
                setFavorites(favorites);
            }
        } catch (error) {
            console.error(error);
        }
    }
    return (
        <Card style={styles.card} onPress={handlefavorites}>
            <Card.Content style={styles.content}>
                <ImageBackground
                    source={{ uri: game.background_image }}
                    style={styles.imageBackground}
                >
                    <BlurView
                        intensity={5}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={styles.blurView}
                    >
                        <View style={styles.overlay}>
                            <Text
                                style={[
                                    styles.title,
                                    {
                                        color: theme.colors.onPrimary,
                                        textShadowColor:
                                            theme.colors.onBackground,
                                    },
                                ]}
                            >
                                {game.name}
                            </Text>
                            <View style={styles.iconContainer}>
                                <IconButton
                                    icon={favorites ? "heart" : "heart-outline"}
                                    iconColor="red"
                                    size={24}
                                    onPress={handlefavorites}
                                />
                            </View>
                        </View>
                    </BlurView>
                </ImageBackground>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
    },
    content: {
        height: 200,
    },
    imageBackground: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 16,
    },
    iconContainer: {
        alignSelf: "flex-end",
    },
    blurView: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
});
