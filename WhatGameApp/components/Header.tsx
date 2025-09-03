import { Link } from "expo-router";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View
      className="flex flex-row items-center"
      style={{
        paddingTop: top,
        flexDirection: "row",
        height: "10%",
        width: "100%",
        paddingHorizontal: 12,
        justifyContent: "space-between",
        backgroundColor: "lightgray",
      }}
    >
      <Link href="/" className="px-4 ">
        <View className="items-center justify-center">
          <Text className="font-semibold text-3xl">WhatGame</Text>
        </View>
      </Link>
    </View>
  );
}
