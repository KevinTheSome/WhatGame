import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar, Text, useTheme } from "react-native-paper";

type SnackbarType = "error" | "info";

interface ErrorSnackBarProps {
      message: string;
      type?: SnackbarType;
      duration?: number;
      onDismiss?: () => void;
}

const ErrorSnackBar: React.FC<ErrorSnackBarProps> = ({
      message,
      type = "error",
      duration = 5000,
      onDismiss = () => {},
}) => {
      const theme = useTheme();
      const [visible, setVisible] = useState(!!message);

      useEffect(() => {
            setVisible(!!message);

            if (message) {
                  const timer = setTimeout(() => {
                        setVisible(false);
                        onDismiss();
                  }, duration);

                  return () => clearTimeout(timer);
            }
      }, [message, duration, onDismiss]);

      const getBackgroundColor = () => {
            switch (type) {
                  case "info":
                        return theme.colors.primary;
                  case "error":
                  default:
                        return theme.colors.error;
            }
      };

      const handleDismiss = () => {
            setVisible(false);
            onDismiss();
      };

      if (!message) return null;

      return (
            <View style={styles.wrapper}>
                  <Snackbar
                        visible={visible}
                        onDismiss={handleDismiss}
                        duration={duration}
                        style={[
                              styles.snackbar,
                              { backgroundColor: getBackgroundColor() },
                        ]}
                        action={{
                              label: "Dismiss",
                              onPress: handleDismiss,
                              labelStyle: { color: theme.colors.onSurface },
                        }}
                  >
                        <Text style={{ color: theme.colors.onError }}>
                              {message}
                        </Text>
                  </Snackbar>
            </View>
      );
};

const styles = StyleSheet.create({
      wrapper: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
      },
      snackbar: {
            margin: 16,
            marginBottom: 24,
            borderRadius: 8,
      },
});

export default ErrorSnackBar;
