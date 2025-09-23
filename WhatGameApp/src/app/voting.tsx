import { View, StyleSheet, SafeAreaView } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VotingView() {
  /*
    This is a placeholder for the voting view.
    The actual voting view will be implemented later hopefully.
  */
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackToLobby = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background }
      ]}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text variant="headlineMedium" style={styles.title}>
          Voting in Progress
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Players are currently voting on game options
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text variant="titleLarge" style={styles.placeholderTitle}>
            Voting Interface Coming Soon
          </Text>
          <Text variant="bodyMedium" style={styles.placeholderText}>
            This is where the voting interface will be displayed.
            Players will be able to see voting options and cast their votes here.
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={handleBackToLobby}
            style={styles.backButton}
            labelStyle={styles.buttonLabel}
          >
            Back to Lobby
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  placeholderContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 32,
  },
  placeholderTitle: {
    marginBottom: 16,
    fontWeight: "600",
  },
  placeholderText: {
    textAlign: "center",
    lineHeight: 24,
  },
  actionsContainer: {
    alignItems: "center",
  },
  backButton: {
    minWidth: 120,
  },
  buttonLabel: {
    fontSize: 16,
  },
});
