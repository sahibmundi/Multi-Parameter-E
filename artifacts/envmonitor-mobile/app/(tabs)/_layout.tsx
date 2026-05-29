import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useApp } from "@/context/AppContext";
import { t } from "@/constants/translations";

export default function TabLayout() {
  const { lang } = useApp();
  const isDark = true;
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00F5FF",
        tabBarInactiveTintColor: "#4A5568",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0D1F3C",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,245,255,0.12)",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0D1F3C" }]} />
          ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(lang, 'dashboard'),
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: t(lang, 'health'),
          tabBarIcon: ({ color, size }) => <Feather name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t(lang, 'history'),
          tabBarIcon: ({ color, size }) => <Feather name="trending-up" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t(lang, 'settings'),
          tabBarIcon: ({ color, size }) => <Feather name="sliders" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
