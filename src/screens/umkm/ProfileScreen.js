import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import getDatabase from "../../database/database";
import Icon from "react-native-vector-icons/MaterialIcons";

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya", onPress: logout },
    ]);
  };

  const handleUpdateProfile = () => {
    Alert.alert("Info", "Fitur update profil akan segera tersedia");
  };

  const handleChangePassword = () => {
    Alert.alert("Info", "Fitur ganti password akan segera tersedia");
  };

  const handleBusinessSettings = () => {
    Alert.alert("Info", "Fitur pengaturan bisnis akan segera tersedia");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="person" size={40} color="white" />
            <View>
              <Text style={styles.headerTitle}>Profil UMKM</Text>
              <Text style={styles.headerSubtitle}>
                Kelola profil bisnis Anda
              </Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="business" size={24} color="white" />
            <Icon name="settings" size={24} color="white" />
          </View>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>UMKM</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Pengaturan Akun</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleUpdateProfile}>
          <Icon name="edit" size={24} color="#48bb78" />
          <Text style={styles.menuText}>Edit Profil</Text>
          <Icon name="chevron-right" size={24} color="#718096" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleChangePassword}
        >
          <Icon name="lock" size={24} color="#48bb78" />
          <Text style={styles.menuText}>Ganti Password</Text>
          <Icon name="chevron-right" size={24} color="#718096" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleBusinessSettings}
        >
          <Icon name="business" size={24} color="#48bb78" />
          <Text style={styles.menuText}>Pengaturan Bisnis</Text>
          <Icon name="chevron-right" size={24} color="#718096" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Lainnya</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("Info", "Fitur bantuan akan segera tersedia")
          }
        >
          <Icon name="help" size={24} color="#48bb78" />
          <Text style={styles.menuText}>Bantuan</Text>
          <Icon name="chevron-right" size={24} color="#718096" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("Info", "Fitur tentang aplikasi akan segera tersedia")
          }
        >
          <Icon name="info" size={24} color="#48bb78" />
          <Text style={styles.menuText}>Tentang Aplikasi</Text>
          <Icon name="chevron-right" size={24} color="#718096" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={24} color="#e53e3e" />
          <Text style={styles.logoutText}>Logout</Text>
          <Icon name="chevron-right" size={24} color="#e53e3e" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  header: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#c6f6d5",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#48bb78",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: "#48bb78",
    fontWeight: "bold",
    backgroundColor: "#c6f6d5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "500",
  },

  logoutItem: {
    borderColor: "#fed7d7",
    backgroundColor: "#fff5f5",
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: "#e53e3e",
    fontWeight: "500",
  },
});

export default ProfileScreen;
