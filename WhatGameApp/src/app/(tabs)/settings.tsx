import { View, StyleSheet, ScrollView } from "react-native";
import { useState, useEffect, use } from "react";
import { useThemeContext } from "../../contexts/ThemeContext";
import {
    Button,
    Text,
    TextInput,
    useTheme,
    ActivityIndicator,
    Card,
    Avatar,
    Modal,
    Portal,
} from "react-native-paper";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

export default function Tab() {
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [editedEmail, setEditedEmail] = useState("");
    const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
        useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useNavigation();

    const { themePreference, setThemePreference } = useThemeContext();

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {}, []);

    async function getUser() {
        const userString = await SecureStore.getItemAsync("user");
        if (userString) {
            const userData = JSON.parse(userString);
            setUser(userData);
            setEditedName(userData.name);
            setEditedEmail(userData.email);
        }
        setLoading(false);
    }

    useEffect(() => {
        getUser();
    }, []);

    async function logout() {
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("user");
        router.replace("/auth");
    }

    async function delUser() {
        if (password === "") {
            setError("Password is required");
            return;
        }
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/delUser`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                    },
                    body: JSON.stringify({
                        user_pass: password,
                    }),
                },
            );

            const data = await response.json();

            if (response.ok) {
                setIsChangePasswordModalVisible(false);
                setOldPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
                setError("");
                await SecureStore.deleteItemAsync("token");
                await SecureStore.deleteItemAsync("user");
                router.replace("/auth");
            } else {
                setError(
                    data.error ||
                        "Failed to delete user, make sure you entered the correct password",
                );
            }
        } catch (error) {
            setError("An unexpected error occurred.");
            console.error(error);
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/changePassword`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                    },
                    body: JSON.stringify({
                        user_pass: oldPassword,
                        new_pass: newPassword,
                        new_pass_confirm: confirmNewPassword,
                    }),
                },
            );

            const data = await response.json();

            if (response.ok) {
                setIsChangePasswordModalVisible(false);
                setOldPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
                setError("");
            } else {
                setError(data.error || "Failed to change password");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
            console.error(error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/updateUser`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
                    },
                    body: JSON.stringify({
                        name: editedName,
                        email: editedEmail,
                    }),
                },
            );

            const data = await response.json();

            if (response.ok) {
                await SecureStore.setItemAsync(
                    "user",
                    JSON.stringify(data.user),
                );
                setUser(data.user);
                setIsEditModalVisible(false);
            } else {
                setError(data.message || "Failed to update profile");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
            console.error(error);
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
        <ScrollView
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.background,
                    paddingTop: insets.top,
                },
            ]}
        >
            <Text
                variant="headlineLarge"
                style={[styles.title, { color: theme.colors.onBackground }]}
            >
                Settings
            </Text>
            <Card style={styles.card}>
                <Card.Title
                    title="Account"
                    left={(props) => <Avatar.Icon {...props} icon="account" />}
                />
                <Card.Content>
                    <Text>Username: {user?.name}</Text>
                    <Text>Email: {user?.email}</Text>
                    <Button onPress={() => setIsEditModalVisible(true)}>
                        Edit Profile
                    </Button>
                    <Button
                        onPress={() => setIsChangePasswordModalVisible(true)}
                    >
                        Change Password
                    </Button>
                    <Button onPress={logout}>Logout</Button>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title
                    title="Appearance"
                    left={(props) => <Avatar.Icon {...props} icon="palette" />}
                />
                <Card.Content>
                    <Text>
                        Current:{" "}
                        {themePreference === "system"
                            ? "System Default"
                            : themePreference.charAt(0).toUpperCase() +
                              themePreference.slice(1)}
                    </Text>
                    <Button onPress={() => setThemePreference("system")}>
                        Use System Default
                    </Button>
                    <Button onPress={() => setThemePreference("light")}>
                        Light Theme
                    </Button>
                    <Button onPress={() => setThemePreference("dark")}>
                        Dark Theme
                    </Button>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title
                    title="Danger Zone"
                    left={(props) => (
                        <Avatar.Icon {...props} icon="alert-circle" />
                    )}
                />
                <Card.Content>
                    <TextInput
                        label="Password"
                        value={password}
                        secureTextEntry
                        onChangeText={setPassword}
                    />
                    {error ? (
                        <Text
                            style={[
                                styles.errorText,
                                { color: theme.colors.error },
                            ]}
                        >
                            {error}
                        </Text>
                    ) : null}
                    <Button onPress={delUser}>Delete User</Button>
                </Card.Content>
            </Card>

            <Portal>
                <Modal
                    visible={isEditModalVisible}
                    onDismiss={() => setIsEditModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card>
                        <Card.Title title="Edit Profile" />
                        <Card.Content>
                            <TextInput
                                label="Name"
                                value={editedName}
                                onChangeText={setEditedName}
                                style={styles.input}
                            />
                            <TextInput
                                label="Email"
                                value={editedEmail}
                                onChangeText={setEditedEmail}
                                style={styles.input}
                            />
                            <Button onPress={handleUpdateProfile}>Save</Button>
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>

            <Portal>
                <Modal
                    visible={isChangePasswordModalVisible}
                    onDismiss={() => setIsChangePasswordModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card>
                        <Card.Title title="Change Password" />
                        <Card.Content>
                            <TextInput
                                label="Old Password"
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                secureTextEntry
                                style={styles.input}
                            />
                            <TextInput
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                style={styles.input}
                            />
                            <TextInput
                                label="Confirm New Password"
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                secureTextEntry
                                style={styles.input}
                            />
                            <Button onPress={handleChangePassword}>Save</Button>
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>
        </ScrollView>
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
    card: {
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        marginTop: 8,
    },
    modalContainer: {
        padding: 20,
    },
    input: {
        marginBottom: 16,
    },
});
