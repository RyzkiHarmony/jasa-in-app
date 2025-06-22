import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/components/Navigation";
import { initializeDatabase } from "./src/database/database";

export default function App() {
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initializeDatabase();
        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Database initialization failed:", error);
        Alert.alert("Error", "Gagal menginisialisasi database");
      }
    };

    setupDatabase();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
