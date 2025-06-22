import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Mohon isi semua field");
      return;
    }

    try {
      await login(email, password);
      // Navigation will be handled by App.js based on user state
    } catch (error) {
      Alert.alert("Login Gagal", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={styles.sunContainer}>
            <Icon name="wb-sunny" size={40} color="#ff9800" />
          </View>
          <View style={styles.characterContainer}>
            <View style={styles.musicNotes}>
              <Icon name="music-note" size={16} color="#68d391" />
              <Icon name="music-note" size={18} color="#68d391" />
              <Icon name="music-note" size={16} color="#68d391" />
            </View>
            <View style={styles.character}>
              <Icon name="face" size={30} color="#fbbf24" />
              <View style={styles.headphones}>
                <Icon name="headset" size={35} color="#48bb78" />
              </View>
            </View>
            <View style={styles.flowers}>
              <Icon name="eco" size={20} color="#68d391" />
              <Icon name="eco" size={20} color="#68d391" />
              <Icon name="eco" size={20} color="#68d391" />
            </View>
          </View>
        </View>
        <Text style={styles.title}>JASA-IN</Text>
        <Text style={styles.subtitle}>Platform Jasa UMKM Terpercaya</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.registerButtonText}>
              Belum punya akun? Daftar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Account:</Text>
          <Text style={styles.demoText}>Customer: john@example.com</Text>
          <Text style={styles.demoText}>UMKM: laundry@example.com</Text>
          <Text style={styles.demoText}>Password: password123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  sunContainer: {
    position: "absolute",
    top: -20,
    right: 20,
  },
  sun: {
    fontSize: 40,
  },
  characterContainer: {
    alignItems: "center",
    position: "relative",
  },
  musicNotes: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    transform: [{ rotate: "-15deg" }],
    gap: 4,
  },
  character: {
    width: 80,
    height: 80,
    backgroundColor: "#2d3748",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    position: "relative",
  },

  headphones: {
    position: "absolute",
    top: -10,
  },

  flowers: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: 120,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2d3748",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#718096",
    marginBottom: 50,
  },
  form: {
    marginBottom: 40,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButton: {
    backgroundColor: "#48bb78",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: "#68d391",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#48bb78",
  },
  registerButtonText: {
    color: "#2d3748",
    fontSize: 16,
    fontWeight: "600",
  },
  demoInfo: {
    backgroundColor: "#f7fafc",
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    marginTop: 20,
  },
  demoTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2d3748",
    fontSize: 14,
  },
  demoText: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 3,
  },
});

export default LoginScreen;
