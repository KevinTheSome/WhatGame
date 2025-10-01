import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { View, Text, ActivityIndicator } from "react-native";

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" />
                <Text>Loading...</Text>
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)" />;
    } else {
        return <Redirect href="/auth" />;
    }
}
