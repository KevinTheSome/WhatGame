import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function NavTabs() {
  const { bottom } = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = React.useState("");
  const [pendingFraind, setPendingFraind] = React.useState(false);

  return (
    <View
      className="flex flex-row bg-gray-100 items-center"
      style={{
        paddingBottom: bottom,
        flexDirection: "row",
        height: "10%",
        width: "100%",
        paddingHorizontal: 12,
        justifyContent: "space-between",
      }}
    >
      <Link href="/" className="px-4" onPress={() => setSelectedTab("Home")}>
        <View className="items-center justify-center">
          <Ionicons name="home-outline" size={20} color="black" />
          <Text className="font-semibold text-blue-400">Home</Text>
        </View>
      </Link>
      <Link href="/" className="px-4 w-full h-full">
        <View className="items-center justify-center">
          {pendingFraind && (
            <Ionicons
              name="ellipse"
              size={8}
              color="red"
              className="absolute"
            />
          )}
          <Ionicons name="person-outline" size={20} color="black" />
          <Text className="font-semibold text-blue-400">Frainds</Text>
        </View>
      </Link>
      <Link href="/" className="px-4">
        <View className="items-center justify-center">
          <Ionicons name="people-circle-outline" size={20} color="black" />
          <Text className="font-semibold text-blue-400">Lobbys</Text>
        </View>
      </Link>
      <Link href="/settings" className="px-4">
        <View className="items-center justify-center">
          <Ionicons name="settings-outline" size={20} color="black" />
          <Text className="font-semibold text-blue-400">Settings</Text>
        </View>
      </Link>
    </View>
  );
}
