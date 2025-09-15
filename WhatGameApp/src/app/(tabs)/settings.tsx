import { View, StyleSheet, Appearance, ScrollView } from "react-native";
import { useState, useEffect } from "react";
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

export default function Tab() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

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

  function toggleTheme() {
    Appearance.setColorScheme(
      Appearance.getColorScheme() === "light" ? "dark" : "light"
    );
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    router.replace("/auth");
  }

  async function delUser() {
    // ... (rest of the function is unchanged)
  }

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
          body: JSON.stringify({ name: editedName, email: editedEmail }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync("user", JSON.stringify(data.user));
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Title
          title="Account"
          left={(props) => <Avatar.Icon {...props} icon="account" />}
        />
        <Card.Content>
          <Text>Username: {user?.name}</Text>
          <Text>Email: {user?.email}</Text>
          <Button onPress={() => setIsEditModalVisible(true)}>Edit Profile</Button>
          <Button onPress={logout}>Logout</Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Appearance"
          left={(props) => <Avatar.Icon {...props} icon="palette" />}
        />
        <Card.Content>
          <Button onPress={toggleTheme}>Toggle Theme</Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Danger Zone"
          left={(props) => <Avatar.Icon {...props} icon="alert-circle" />}
        />
        <Card.Content>
          <TextInput
            label="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    color: 'red',
    marginTop: 8,
  },
  modalContainer: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
});
