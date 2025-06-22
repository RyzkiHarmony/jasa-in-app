import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/dateUtils";
import Icon from "react-native-vector-icons/MaterialIcons";

const ManageServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Laundry",
  });
  const { user } = useAuth();

  const categories = ["Laundry", "Servis AC", "Pangkas Rambut", "Les Privat"];

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadServices();
    });

    return unsubscribe;
  }, [navigation]);

  const loadServices = () => {
    try {
      const db = getDatabase();
      const servicesData = db.getAllSync(
        "SELECT * FROM services WHERE umkm_id = ? ORDER BY name",
        [user.id]
      );
      setServices(servicesData);
    } catch (error) {
      console.log("Error loading services:", error);
      Alert.alert("Error", "Gagal memuat data layanan");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
    setRefreshing(false);
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Laundry",
    });
    setModalVisible(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      category: service.category,
    });
    setModalVisible(true);
  };

  const handleDeleteService = (service) => {
    Alert.alert(
      "Konfirmasi",
      `Apakah Anda yakin ingin menghapus layanan "${service.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => confirmDeleteService(service.id),
        },
      ]
    );
  };

  const confirmDeleteService = (serviceId) => {
    try {
      const db = getDatabase();
      db.runSync("DELETE FROM services WHERE id = ?", [serviceId]);
      loadServices();
      Alert.alert("Sukses", "Layanan berhasil dihapus");
    } catch (error) {
      console.log("Error deleting service:", error);
      Alert.alert("Error", "Gagal menghapus layanan");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Nama layanan tidak boleh kosong");
      return false;
    }

    if (!formData.price.trim()) {
      Alert.alert("Error", "Harga layanan tidak boleh kosong");
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Harga layanan harus berupa angka positif");
      return false;
    }

    return true;
  };

  const handleSaveService = () => {
    if (!validateForm()) return;

    const price = parseFloat(formData.price);

    try {
      const db = getDatabase();

      if (editingService) {
        // Update existing service
        db.runSync(
          "UPDATE services SET name = ?, description = ?, price = ?, category = ? WHERE id = ?",
          [
            formData.name.trim(),
            formData.description.trim(),
            price,
            formData.category,
            editingService.id,
          ]
        );
        Alert.alert("Sukses", "Layanan berhasil diperbarui");
      } else {
        // Add new service
        db.runSync(
          "INSERT INTO services (umkm_id, name, description, price, category, rating) VALUES (?, ?, ?, ?, ?, ?)",
          [
            user.id,
            formData.name.trim(),
            formData.description.trim(),
            price,
            formData.category,
            0,
          ]
        );
        Alert.alert("Sukses", "Layanan berhasil ditambahkan");
      }

      loadServices();
      setModalVisible(false);
    } catch (error) {
      console.log("Error saving service:", error);
      Alert.alert(
        "Error",
        editingService
          ? "Gagal memperbarui layanan"
          : "Gagal menambahkan layanan"
      );
    }
  };

  const renderService = ({ item }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>
          {formatPrice(item.price)}
        </Text>
      </View>

      <Text style={styles.serviceDescription}>
        {item.description || "Tidak ada deskripsi"}
      </Text>

      <View style={styles.serviceFooter}>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={16} color="#ff9800" />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditService(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteService(item)}
        >
          <Text style={styles.deleteButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContainer}
    >
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Layanan</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Nama layanan"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            placeholder="Deskripsi layanan"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Harga (Rp)</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="Harga layanan"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              style={styles.picker}
            >
              {categories.map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSaveService}
          >
            <Text style={styles.saveButtonText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="build" size={30} color="#48bb78" />
            <View>
              <Text style={styles.headerTitle}>Kelola Layanan</Text>
              <Text style={styles.headerSubtitle}>
                Tambah dan edit layanan Anda
              </Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="settings" size={24} color="#48bb78" />
            <Icon name="inventory" size={24} color="#48bb78" />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
        <View style={styles.addButtonContent}>
          <Icon name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Tambah Layanan Baru</Text>
        </View>
      </TouchableOpacity>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderService}
        contentContainerStyle={styles.servicesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada layanan</Text>
            <Text style={styles.emptySubtext}>
              Tambahkan layanan untuk mulai menerima booking
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        {renderServiceForm()}
      </Modal>
    </View>
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
  serviceIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  addIcon: {
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
  addButton: {
    backgroundColor: "#48bb78",
    margin: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  servicesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#c6f6d5",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#48bb78",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  category: {
    fontSize: 12,
    color: "#2d3748",
    backgroundColor: "#f0fff4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: "#ff9800",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#48bb78",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 20,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#2d3748",
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#c6f6d5",
    color: "#2d3748",
  },
  textArea: {
    minHeight: 100,
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: "#c6f6d5",
    borderRadius: 12,
    backgroundColor: "#f0f8ff",
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#48bb78",
    elevation: 2,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ManageServicesScreen;
