import { StyleSheet, View } from "react-native";
import { useState, useEffect } from "react";
import { Text, Card, Button, useTheme, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

export default function LobbyCardItem(props: any) {
    const theme = useTheme();
    const [lobby, setLobby] = useState(props.lobby);
    const [isInLobby, setIsInLobby] = useState<boolean | null>(lobby.in_lobby);

    function handleLogin() {
        props.handleJoinLobby(lobby);
    }

    return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title
                title={lobby.name}
                titleStyle={styles.title}
                left={(props) => (
                    <Avatar.Icon
                        {...props}
                        icon="account-group"
                        size={44}
                        style={{
                            backgroundColor: theme.colors.primaryContainer,
                        }}
                    />
                )}
            />
            <Card.Content style={styles.content}>
                <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                        name="account-multiple"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.icon}
                    />
                    <Text variant="bodyMedium" style={styles.infoText}>
                        {lobby.user_count} / {lobby.max_players} players
                        {isInLobby && (
                            <Text
                                style={{
                                    color: theme.colors.primary,
                                    fontWeight: "bold",
                                }}
                            >
                                {" "}
                                (You're here)
                            </Text>
                        )}
                    </Text>
                </View>
                {lobby.filter && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                            name="account-lock"
                            size={18}
                            color={theme.colors.secondary}
                            style={styles.icon}
                        />
                        <Text
                            variant="bodySmall"
                            style={[
                                styles.infoText,
                                { color: theme.colors.onSurfaceVariant },
                            ]}
                        >
                            {lobby.filter}
                        </Text>
                    </View>
                )}
            </Card.Content>
            <Card.Actions style={styles.actions}>
                <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    icon="login"
                    disabled={isInLobby}
                >
                    {isInLobby ? "In Lobby" : "Join Lobby"}
                </Button>
            </Card.Actions>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 8,
        borderRadius: 12,
        elevation: 2,
    },
    title: {
        fontWeight: "600",
        marginVertical: 8,
    },
    content: {
        paddingTop: 0,
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
    },
    icon: {
        marginRight: 8,
    },
    infoText: {
        fontSize: 14,
    },
    actions: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        justifyContent: "flex-end",
    },
    button: {
        borderRadius: 20,
        marginLeft: 8,
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
});
