import { useEffect, useState, useCallback } from "react";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function noConnection() {
    const router = useRouter();
    const theme = useTheme();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(
                        `${process.env.EXPO_PUBLIC_API_URL}/status`,
                    );
                    if (response.ok) {
                        router.replace("/");
                    }
                } catch (error) {
                    // No connection, keep checking
                }
            }, 5000);

            return () => clearInterval(interval);
        }, [router]),
    );

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="wifi-outline" size={80} color="#666" />
                <View style={styles.xOverlay}>
                    <Ionicons name="close-outline" size={40} color="#f00" />
                </View>
            </View>
            <Text style={styles.text}>Checking connection...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainer: {
        position: "relative",
        width: 80,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    xOverlay: {
        position: "absolute",
        top: 20,
        left: 20,
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
    },
});
