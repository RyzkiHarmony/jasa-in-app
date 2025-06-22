import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { getCurrentJakartaTime, formatDateJakarta, formatPrice, toDBFormat } from "../../utils/dateUtils";

const PromotionsScreen = ({ navigation }) => {
  const [promotions, setPromotions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: "",
    discount_amount: "",
    min_purchase: "",
    max_discount: "",
    start_date: "",
    end_date: "",
    quota: "",
    type: "percentage", // percentage or amount
  });
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPromotions();
    });
    return unsubscribe;
  }, [navigation]);

  const loadPromotions = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT p.*, COUNT(pu.id) as used_count
         FROM promotions p
         LEFT JOIN promotion_usage pu ON p.id = pu.promotion_id
         WHERE p.umkm_id = ?
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        [user.id]
      );
      setPromotions(result);
    } catch (error) {
      console.log("Error loading promotions:", error);
      Alert.alert("Error", "Gagal memuat data promosi");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromotions();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingPromotion(null);
    setFormData({
      title: "",
      description: "",
      discount_percentage: "",
      discount_amount: "",
      min_purchase: "",
      max_discount: "",
      start_date: "",
      end_date: "",
      quota: "",
      type: "percentage",
    });
    setModalVisible(true);
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      discount_percentage: promotion.discount_percentage?.toString() || "",
      discount_amount: promotion.discount_amount?.toString() || "",
      min_purchase: promotion.min_purchase?.toString() || "",
      max_discount: promotion.max_discount?.toString() || "",
      start_date: promotion.start_date || "",
      end_date: promotion.end_date || "",
      quota: promotion.quota?.toString() || "",
      type: promotion.discount_percentage ? "percentage" : "amount",
    });
    setModalVisible(true);
  };

  const savePromotion = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert("Error", "Judul dan deskripsi harus diisi");
      return;
    }

    if (formData.type === "percentage" && !formData.discount_percentage) {
      Alert.alert("Error", "Persentase diskon harus diisi");
      return;
    }

    if (formData.type === "amount" && !formData.discount_amount) {
      Alert.alert("Error", "Nominal diskon harus diisi");
      return;
    }

    try {
      const db = getDatabase();
      const now = toDBFormat(getCurrentJakartaTime());

      if (editingPromotion) {
        // Update existing promotion
        db.runSync(
          `UPDATE promotions SET 
           title = ?, description = ?, discount_percentage = ?, discount_amount = ?,
           min_purchase = ?, max_discount = ?, start_date = ?, end_date = ?,
           quota = ?, updated_at = ?
           WHERE id = ?`,
          [
            formData.title,
            formData.description,
            formData.type === "percentage" ? parseFloat(formData.discount_percentage) : null,
            formData.type === "amount" ? parseFloat(formData.discount_amount) : null,
            formData.min_purchase ? parseFloat(formData.min_purchase) : null,
            formData.max_discount ? parseFloat(formData.max_discount) : null,
            formData.start_date || null,
            formData.end_date || null,
            formData.quota ? parseInt(formData.quota) : null,
            now,
            editingPromotion.id,
          ]
        );
        Alert.alert("Berhasil", "Promosi berhasil diperbarui");
      } else {
        // Create new promotion
        db.runSync(
          `INSERT INTO promotions 
           (umkm_id, title, description, discount_percentage, discount_amount,
            min_purchase, max_discount, start_date, end_date, quota, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            user.id,
            formData.title,
            formData.description,
            formData.type === "percentage" ? parseFloat(formData.discount_percentage) : null,
            formData.type === "amount" ? parseFloat(formData.discount_amount) : null,
            formData.min_purchase ? parseFloat(formData.min_purchase) : null,
            formData.max_discount ? parseFloat(formData.max_discount) : null,
            formData.start_date || null,
            formData.end_date || null,
            formData.quota ? parseInt(formData.quota) : null,
            now,
          ]
        );
        Alert.alert("Berhasil", "Promosi berhasil dibuat");
      }

      setModalVisible(false);
      loadPromotions();
    } catch (error) {
      console.log("Error saving promotion:", error);
      Alert.alert("Error", "Gagal menyimpan promosi");
    }
  };

  const togglePromotionStatus = (promotion) => {
    Alert.alert(
      promotion.is_active ? "Nonaktifkan Promosi" : "Aktifkan Promosi",
      `Apakah Anda yakin ingin ${promotion.is_active ? "menonaktifkan" : "mengaktifkan"} promosi ini?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: promotion.is_active ? "Nonaktifkan" : "Aktifkan",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync(
                "UPDATE promotions SET is_active = ? WHERE id = ?",
                [promotion.is_active ? 0 : 1, promotion.id]
              );
              loadPromotions();
              Alert.alert(
                "Berhasil",
                `Promosi berhasil ${promotion.is_active ? "dinonaktifkan" : "diaktifkan"}`
              );
            } catch (error) {
              console.log("Error toggling promotion:", error);
              Alert.alert("Error", "Gagal mengubah status promosi");
            }
          },
        },
      ]
    );
  };

  const deletePromotion = (promotionId) => {
    Alert.alert(
      "Hapus Promosi",
      "Apakah Anda yakin ingin menghapus promosi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync("DELETE FROM promotions WHERE id = ?", [promotionId]);
              loadPromotions();
              Alert.alert("Berhasil", "Promosi berhasil dihapus");
            } catch (error) {
              console.log("Error deleting promotion:", error);
              Alert.alert("Error", "Gagal menghapus promosi");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Tidak terbatas";
    return formatDateJakarta(dateString);
  };

  const getPromotionStatus = (promotion) => {
    if (!promotion.is_active) return { text: "Nonaktif", color: "#a0aec0" };
    
    const now = getCurrentJakartaTime();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;
    
    if (startDate && now < startDate) {
      return { text: "Belum Dimulai", color: "#f6ad55" };
    }
    
    if (endDate && now > endDate) {
      return { text: "Berakhir", color: "#f56565" };
    }
    
    if (promotion.quota && promotion.used_count >= promotion.quota) {
      return { text: "Kuota Habis", color: "#f56565" };
    }
    
    return { text: "Aktif", color: "#48bb78" };
  };

  const renderPromotion = ({ item }) => {
    const status = getPromotionStatus(item);
    
    return (
      <View style={styles.promotionCard}>
        <View style={styles.promotionHeader}>
          <View style={styles.promotionTitleContainer}>
            <Text style={styles.promotionTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          </View>
          <View style={styles.promotionActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Icon name="edit" size={20} color="#4299e1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => togglePromotionStatus(item)}
            >
              <Icon 
                name={item.is_active ? "visibility-off" : "visibility"} 
                size={20} 
                color={item.is_active ? "#f6ad55" : "#48bb78"} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deletePromotion(item.id)}
            >
              <Icon name="delete" size={20} color="#f56565" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.promotionDescription}>{item.description}</Text>
        
        <View style={styles.promotionDetails}>
          <View style={styles.detailRow}>
            <Icon name="local-offer" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.discount_percentage 
                ? `${item.discount_percentage}% off`
                : `${formatPrice(item.discount_amount)} off`
              }
            </Text>
          </View>
          
          {item.min_purchase && (
            <View style={styles.detailRow}>
              <Icon name="shopping-cart" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                Min. pembelian {formatPrice(item.min_purchase)}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Icon name="event" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {formatDate(item.start_date)} - {formatDate(item.end_date)}
            </Text>
          </View>
          
          {item.quota && (
            <View style={styles.detailRow}>
              <Icon name="people" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.used_count || 0} / {item.quota} digunakan
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Kelola Promosi</Text>
            <Text style={styles.headerSubtitle}>Buat dan kelola promosi</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {promotions.length > 0 ? (
          <FlatList
            data={promotions}
            renderItem={renderPromotion}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.promotionsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="local-offer" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Promosi</Text>
            <Text style={styles.emptyText}>
              Buat promosi menarik untuk menarik lebih banyak pelanggan
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
              <Text style={styles.createButtonText}>Buat Promosi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#2d3748" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPromotion ? "Edit Promosi" : "Buat Promosi"}
            </Text>
            <TouchableOpacity onPress={savePromotion}>
              <Text style={styles.saveButton}>Simpan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Judul Promosi *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Contoh: Diskon Akhir Tahun"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Jelaskan detail promosi..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jenis Diskon</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioOption, formData.type === "percentage" && styles.radioActive]}
                  onPress={() => setFormData({ ...formData, type: "percentage" })}
                >
                  <Text style={[styles.radioText, formData.type === "percentage" && styles.radioTextActive]}>
                    Persentase (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioOption, formData.type === "amount" && styles.radioActive]}
                  onPress={() => setFormData({ ...formData, type: "amount" })}
                >
                  <Text style={[styles.radioText, formData.type === "amount" && styles.radioTextActive]}>
                    Nominal (Rp)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.type === "percentage" ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Persentase Diskon (%) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount_percentage}
                  onChangeText={(text) => setFormData({ ...formData, discount_percentage: text })}
                  placeholder="Contoh: 20"
                  keyboardType="numeric"
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nominal Diskon (Rp) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount_amount}
                  onChangeText={(text) => setFormData({ ...formData, discount_amount: text })}
                  placeholder="Contoh: 50000"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Minimal Pembelian (Rp)</Text>
              <TextInput
                style={styles.input}
                value={formData.min_purchase}
                onChangeText={(text) => setFormData({ ...formData, min_purchase: text })}
                placeholder="Contoh: 100000"
                keyboardType="numeric"
              />
            </View>

            {formData.type === "percentage" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Maksimal Diskon (Rp)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.max_discount}
                  onChangeText={(text) => setFormData({ ...formData, max_discount: text })}
                  placeholder="Contoh: 100000"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Kuota Penggunaan</Text>
              <TextInput
                style={styles.input}
                value={formData.quota}
                onChangeText={(text) => setFormData({ ...formData, quota: text })}
                placeholder="Contoh: 100 (kosongkan untuk unlimited)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Mulai (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.start_date}
                onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                placeholder="2024-01-01 (kosongkan untuk mulai sekarang)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Berakhir (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.end_date}
                onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                placeholder="2024-12-31 (kosongkan untuk unlimited)"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fcff",
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
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  promotionsList: {
    paddingBottom: 20,
  },
  promotionCard: {
    backgroundColor: "white",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  promotionTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  promotionActions: {
    flexDirection: "row",
    gap: 5,
  },
  actionButton: {
    padding: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
    marginBottom: 15,
  },
  promotionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#48bb78",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    backgroundColor: "white",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 10,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    alignItems: "center",
  },
  radioActive: {
    backgroundColor: "#48bb78",
    borderColor: "#48bb78",
  },
  radioText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  radioTextActive: {
    color: "white",
    fontWeight: "bold",
  },
});

export default PromotionsScreen;