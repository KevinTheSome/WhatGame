import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  effectiveColorScheme: 'light' | 'dark' | null;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreferenceLocal] = useState<ThemePreference>('system');
  const systemColorScheme = useColorScheme();
  const effectiveColorScheme = themePreference === 'system' ? systemColorScheme : themePreference;

  useEffect(() => {
    loadThemePreference();
  }, []);

  async function loadThemePreference() {
    try {
      const saved = await SecureStore.getItemAsync('themePreference');
      if (saved && ['system', 'light', 'dark'].includes(saved)) {
        setThemePreferenceLocal(saved as ThemePreference);
      } else {
        setThemePreferenceLocal('system');
        await SecureStore.setItemAsync('themePreference', 'system');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      setThemePreferenceLocal('system');
    }
  }

  const setThemePreference = async (newPreference: ThemePreference) => {
    try {
      await SecureStore.setItemAsync('themePreference', newPreference);
      setThemePreferenceLocal(newPreference);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, effectiveColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
