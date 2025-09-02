import { ScreenContent } from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import './global.css';

export default function App() {
  return (
    <>
      <ScreenContent title="Home" path="App.tsx"></ScreenContent>
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl text-red-700">Ahhhhhhhhh</Text>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
