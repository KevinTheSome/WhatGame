import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

export default function Page() {
    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>("");
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        const clearToken = async () => {
            await SecureStore.deleteItemAsync("token");
        };
        clearToken();
    }, []);

    // pārbauda vai nav kļūda un saglabā "token"
    async function handleResponse(response: object) {
        if (response["email"] != null) {
            setError(response["email"]);
        } else {
            save("token", response.access_token);
            save("userName", response.user.name);
            save("user", JSON.stringify(response.user));
        }
    }

    async function signUp(name: string, email: string, password: string) {
        try {
            const response = await fetch(
                process.env.EXPO_PUBLIC_API_URL + "/register",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name, email, password }),
                },
            );
            const json = await response.json();
            if (json["error"] != null) {
                return json["error"];
            }
            handleResponse(json);
        } catch (error) {
            return "Failed to sign up";
        }
    }

    // Izmantojot expo saglaba lietotne "token"
    async function save(key, value) {
        await SecureStore.setItemAsync(key, value);
    }

    // aisūta datus uz aizmugursistēmu
    async function signIn(email: string, password: string) {
        // meiģina aizmugursistēmu un saglaba "token"
        try {
            // aisūta datus uz aizmugursistēmu
            const response = await fetch(
                process.env.EXPO_PUBLIC_API_URL + "/login",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                },
            );
            // partaisa aizmugursistēmu atbilde uz "Object"
            const json = await response.json();

            // pārbauda vai nav kļūda no aizmugursistēmu
            if (json["error"] != null) {
                return json["error"];
            }
            // saglaba atbildi aizmugursistēmu
            handleResponse(json);
        } catch (error) {
            return "Failed to sign in";
        }
    }

    // pārbauda vai nav kļūda un aisuta request pareizaja vieta
    const handleAuth = async () => {
        // pārbauda vai e-pasts vai parole ir tukša
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        // pārbauda vai vards nav tukš
        if (isSignUp && !name) {
            setError("Please fill in all fields.");
            return;
        }

        // pārbauda vai parole ir vairak par 8 rakstzīmēm
        if (password.length < 8) {
            setError("Passwords must be at least 8 characters long.");
            return;
        }

        // izdzēš iepriekšējo kļūdu
        setError(null);

        // saglaba kļudu no aizmugursistēmu
        let authError;
        if (isSignUp) {
            authError = await signUp(name, email, password);
        } else {
            authError = await signIn(email, password);
        }

        // lietotājam izvada kļūdu
        if (authError) {
            setError(authError);
            return;
        }

        // ja veiksmigi aizved lietotāju uz "home" skatu
        if ((await SecureStore.getItemAsync("token")) != null) {
            router.replace("/");
        }
    };

    const handleSwitchMode = () => {
        setIsSignUp((prev) => !prev);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View
                style={[
                    styles.content,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <View
                    style={[
                        styles.titleContainer,
                        { flexDirection: "column", justifyContent: "flex-end" },
                    ]}
                >
                    <Text
                        style={[
                            styles.title,
                            {
                                color: theme.colors.primary,
                                fontWeight: "bold",
                                fontSize: 48,
                            },
                        ]}
                        variant="headlineLarge"
                    >
                        WhatGame?
                    </Text>
                </View>
                <Text style={styles.title} variant="headlineMedium">
                    {" "}
                    {isSignUp ? "Create Account" : "Welcome Back"}
                </Text>

                {isSignUp && (
                    <TextInput
                        label="Name"
                        autoCapitalize="none"
                        mode="outlined"
                        style={styles.input}
                        onChangeText={setName}
                    />
                )}

                <TextInput
                    label="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="example@gmail.com"
                    mode="outlined"
                    style={styles.input}
                    onChangeText={setEmail}
                />

                <TextInput
                    label="Password"
                    autoCapitalize="none"
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                    onChangeText={setPassword}
                />

                {error && (
                    <Text style={{ color: theme.colors.error }}> {error}</Text>
                )}

                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={handleAuth}
                >
                    {isSignUp ? "Sign Up" : "Sign In"}
                </Button>

                <Button
                    mode="text"
                    onPress={handleSwitchMode}
                    style={styles.switchModeButton}
                >
                    {isSignUp
                        ? "Already have an account? Sign In"
                        : "Don't have an account? Sign Up"}
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 48,
    },
    content: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
    },
    switchModeButton: {
        marginTop: 16,
    },
});
