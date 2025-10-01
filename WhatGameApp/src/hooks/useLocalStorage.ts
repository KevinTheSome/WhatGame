import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export function useLocalStorage(
    key: string,
    initialValue?: string,
): [string, (value: string) => void, () => void] {
    const isWeb = Platform.OS === "web";

    const [value, setValue] = useState<string>(initialValue ?? "");

    useEffect(() => {
        remove(); // Clear on mount if needed

        const loadValue = async () => {
            try {
                let storedValue: string | null = null;
                if (isWeb) {
                    if (typeof window !== "undefined") {
                        storedValue = localStorage.getItem(key);
                    }
                } else {
                    storedValue = await SecureStore.getItemAsync(key);
                }
                if (storedValue !== null) {
                    setValue(storedValue);
                }
            } catch (error) {
                console.error("Error loading storage:", error);
            }
        };

        loadValue();
    }, [key]);

    const setStoredValue = (newValue: string) => {
        setValue(newValue);
        if (isWeb) {
            if (typeof window !== "undefined") {
                localStorage.setItem(key, newValue);
            }
        } else {
            SecureStore.setItemAsync(key, newValue).catch((error) => {
                console.error("Error saving to secure storage:", error);
            });
        }
    };

    const remove = () => {
        setValue("");
        if (isWeb) {
            if (typeof window !== "undefined") {
                localStorage.removeItem(key);
            }
        } else {
            SecureStore.deleteItemAsync(key).catch((error) => {
                console.error("Error removing from secure storage:", error);
            });
        }
    };

    return [value, setStoredValue, remove] as const;
}
