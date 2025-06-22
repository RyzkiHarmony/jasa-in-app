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
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const { register, loading } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert("Error", "Mohon isi semua field");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter");
      return;
    }

    try {
      await register(name, email, password, phone, role);
      Alert.alert("Sukses", "Akun berhasil dibuat!");
    } catch (error) {
      Alert.alert("Registrasi Gagal", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View style={styles.characterContainer}>
              <Text style={styles.welcomeIcon}>👋</Text>
              <View style={styles.character}>
                <Text style={styles.characterFace}>🤗</Text>
              </View>
              <View style={styles.sparkles}>
                <Text style={styles.sparkle}>✨</Text>
                <Text style={styles.sparkle}>✨</Text>
                <Text style={styles.sparkle}>✨</Text>
              </View>
            </View>
          </View>
          <Text style={styles.title}>Daftar Akun</Text>
          <Text style={styles.subtitle}>Bergabung dengan JASA-IN</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nama Lengkap"
              value={name}
              onChangeText={setName}
            />

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
              placeholder="Password (min. 6 karakter)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Nomor Telepon"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Daftar sebagai:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={role}
                  onValueChange={setRole}
                  style={styles.picker}
                >
                  <Picker.Item label="Customer" value="customer" />
                  <Picker.Item label="UMKM" value="umkm" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Daftar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.loginButtonText}>
                Sudah punya akun? Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  characterContainer: {
    alignItems: "center",
    position: "relative",
  },
  welcomeIcon: {
    fontSize: 20,
    marginBottom: 10,
  },
  character: {
    width: 70,
    height: 70,
    backgroundColor: "#48bb78",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  characterFace: {
    fontSize: 25,
  },
  sparkles: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: 100,
  },
  sparkle: {
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2d3748",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#718096",
    marginBottom: 30,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 15,
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
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#2d3748",
    marginBottom: 8,
    fontWeight: "600",
  },
  pickerWrapper: {
    backgroundColor: "white",
    borderRadius: 25,
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
  picker: {
    height: 50,
  },
  registerButton: {
    backgroundColor: "#48bb78",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginButton: {
    alignItems: "center",
    backgroundColor: "#68d391",
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#48bb78",
  },
  loginButtonText: {
    color: "#2d3748",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RegisterScreen;
