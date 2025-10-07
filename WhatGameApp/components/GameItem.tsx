import { useTheme } from "react-native-paper";
import { Card, Text, IconButton } from "react-native-paper";
import { View, StyleSheet, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";

interface GameItem {
    id: string;
    background_image: string | null;
    name: string;
    votes: number;
}

interface Props {
    item: GameItem;
}

export default function GameItem({ item }: Props) {
    const theme = useTheme();

    // Fallback image if background_image is null or missing
    const imageUri =
        item.background_image ||
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop";

    return (
        <Card style={styles.card}>
            <Card.Content style={styles.content}>
                <ImageBackground
                    source={{ uri: imageUri }}
                    style={styles.imageBackground}
                    resizeMode="cover"
                >
                    <BlurView
                        intensity={10}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={styles.blurView}
                    >
                        <View style={styles.overlay}>
                            <Text style={styles.title} numberOfLines={2}>
                                {item.name}
                            </Text>
                            <View style={styles.bottomRow}>
                                <Text
                                    style={styles.votes}
                                >{`${item.votes} votes`}</Text>
                                <IconButton
                                    icon="vote"
                                    iconColor={theme.colors.primary}
                                    size={24}
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
        borderRadius: 8,
        padding: 0,
    },
    content: {
        height: 200,
    },
    imageBackground: {
        flex: 1,
    },
    blurView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
        flex: 1,
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    votes: {
        fontSize: 16,
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
    },
});
