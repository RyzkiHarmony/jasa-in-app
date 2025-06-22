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

const ScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    type: "available", // available, busy, break
    max_bookings: "",
  });
  const { user } = useAuth();

  const scheduleTypes = [
    { value: "available", label: "Tersedia", color: "#48bb78" },
    { value: "busy", label: "Sibuk", color: "#f56565" },
    { value: "break", label: "Istirahat", color: "#f6ad55" },
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadSchedules();
    });
    return unsubscribe;
  }, [navigation, selectedDate]);

  const loadSchedules = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT s.*, COUNT(b.id) as booking_count
         FROM schedules s
         LEFT JOIN bookings b ON s.id = b.schedule_id AND b.status != 'cancelled'
         WHERE s.umkm_id = ? AND DATE(s.date) = ?
         GROUP BY s.id
         ORDER BY s.start_time ASC`,
        [user.id, selectedDate]
      );
      setSchedules(result);
    } catch (error) {
      console.log("Error loading schedules:", error);
      Alert.alert("Error", "Gagal memuat data jadwal");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSchedules();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setFormData({
      title: "",
      description: "",
      date: selectedDate,
      start_time: "",
      end_time: "",
      type: "available",
      max_bookings: "",
    });
    setModalVisible(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title || "",
      description: schedule.description || "",
      date: schedule.date.split('T')[0],
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      type: schedule.type,
      max_bookings: schedule.max_bookings?.toString() || "",
    });
    setModalVisible(true);
  };

  const saveSchedule = () => {
    if (!formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert("Error", "Tanggal, waktu mulai, dan waktu selesai harus diisi");
      return;
    }

    if (formData.start_time >= formData.end_time) {
      Alert.alert("Error", "Waktu mulai harus lebih awal dari waktu selesai");
      return;
    }

    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      if (editingSchedule) {
        // Update existing schedule
        db.runSync(
          `UPDATE schedules SET 
           title = ?, description = ?, date = ?, start_time = ?, end_time = ?,
           type = ?, max_bookings = ?, updated_at = ?
           WHERE id = ?`,
          [
            formData.title || null,
            formData.description || null,
            formData.date,
            formData.start_time,
            formData.end_time,
            formData.type,
            formData.max_bookings ? parseInt(formData.max_bookings) : null,
            now,
            editingSchedule.id,
          ]
        );
        Alert.alert("Berhasil", "Jadwal berhasil diperbarui");
      } else {
        // Create new schedule
        db.runSync(
          `INSERT INTO schedules 
           (umkm_id, title, description, date, start_time, end_time, type, max_bookings, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            formData.title || null,
            formData.description || null,
            formData.date,
            formData.start_time,
            formData.end_time,
            formData.type,
            formData.max_bookings ? parseInt(formData.max_bookings) : null,
            now,
          ]
        );
        Alert.alert("Berhasil", "Jadwal berhasil dibuat");
      }

      setModalVisible(false);
      loadSchedules();
    } catch (error) {
      console.log("Error saving schedule:", error);
      Alert.alert("Error", "Gagal menyimpan jadwal");
    }
  };

  const deleteSchedule = (scheduleId) => {
    Alert.alert(
      "Hapus Jadwal",
      "Apakah Anda yakin ingin menghapus jadwal ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync("DELETE FROM schedules WHERE id = ?", [scheduleId]);
              loadSchedules();
              Alert.alert("Berhasil", "Jadwal berhasil dihapus");
            } catch (error) {
              console.log("Error deleting schedule:", error);
              Alert.alert("Error", "Gagal menghapus jadwal");
            }
          },
        },
      ]
    );
  };

  const formatTime = (time) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeInfo = (type) => {
    return scheduleTypes.find(t => t.value === type) || scheduleTypes[0];
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? "Hari Ini" : i === 1 ? "Besok" : date.toLocaleDateString("id-ID", { 
          weekday: "short", 
          day: "numeric", 
          month: "short" 
        })
      });
    }
    
    return dates;
  };

  const renderDateSelector = () => {
    const dates = generateDateOptions();
    
    return (
      <View style={styles.dateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date.value}
              style={[
                styles.dateOption,
                selectedDate === date.value && styles.dateOptionActive
              ]}
              onPress={() => setSelectedDate(date.value)}
            >
              <Text style={[
                styles.dateOptionText,
                selectedDate === date.value && styles.dateOptionTextActive
              ]}>
                {date.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSchedule = ({ item }) => {
    const typeInfo = getTypeInfo(item.type);
    const isFullyBooked = item.max_bookings && item.booking_count >= item.max_bookings;
    
    return (
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleTimeContainer}>
            <Text style={styles.scheduleTime}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
              <Text style={styles.typeText}>{typeInfo.label}</Text>
            </View>
          </View>
          <View style={styles.scheduleActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Icon name="edit" size={20} color="#4299e1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteSchedule(item.id)}
            >
              <Icon name="delete" size={20} color="#f56565" />
            </TouchableOpacity>
          </View>
        </View>
        
        {item.title && (
          <Text style={styles.scheduleTitle}>{item.title}</Text>
        )}
        
        {item.description && (
          <Text style={styles.scheduleDescription}>{item.description}</Text>
        )}
        
        <View style={styles.scheduleDetails}>
          {item.max_bookings && (
            <View style={styles.detailRow}>
              <Icon name="people" size={16} color="#6b7280" />
              <Text style={[styles.detailText, isFullyBooked && { color: "#f56565" }]}>
                {item.booking_count || 0} / {item.max_bookings} booking
                {isFullyBooked && " (Penuh)"}
              </Text>
            </View>
          )}
          
          {item.booking_count > 0 && (
            <View style={styles.detailRow}>
              <Icon name="event-note" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.booking_count} booking aktif
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
            <Text style={styles.headerTitle}>Kelola Jadwal</Text>
            <Text style={styles.headerSubtitle}>Atur waktu kerja Anda</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {renderDateSelector()}
        
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            {formatDate(selectedDate)}
          </Text>
        </View>

        {schedules.length > 0 ? (
          <FlatList
            data={schedules}
            renderItem={renderSchedule}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.schedulesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="schedule" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Jadwal</Text>
            <Text style={styles.emptyText}>
              Buat jadwal untuk mengatur waktu kerja Anda pada tanggal ini
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
              <Text style={styles.createButtonText}>Buat Jadwal</Text>
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
              {editingSchedule ? "Edit Jadwal" : "Buat Jadwal"}
            </Text>
            <TouchableOpacity onPress={saveSchedule}>
              <Text style={styles.saveButton}>Simpan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal *</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Waktu Mulai *</Text>
              <TextInput
                style={styles.input}
                value={formData.start_time}
                onChangeText={(text) => setFormData({ ...formData, start_time: text })}
                placeholder="HH:MM (contoh: 09:00)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Waktu Selesai *</Text>
              <TextInput
                style={styles.input}
                value={formData.end_time}
                onChangeText={(text) => setFormData({ ...formData, end_time: text })}
                placeholder="HH:MM (contoh: 17:00)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jenis Jadwal</Text>
              <View style={styles.typeSelector}>
                {scheduleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      { borderColor: type.color },
                      formData.type === type.value && { backgroundColor: type.color }
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      { color: formData.type === type.value ? "white" : type.color }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Judul (Opsional)</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Contoh: Konsultasi Bisnis"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Jelaskan detail jadwal..."
                multiline
                numberOfLines={3}
              />
            </View>

            {formData.type === "available" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Maksimal Booking</Text>
                <TextInput
                  style={styles.input}
                  value={formData.max_bookings}
                  onChangeText={(text) => setFormData({ ...formData, max_bookings: text })}
                  placeholder="Contoh: 5 (kosongkan untuk unlimited)"
                  keyboardType="numeric"
                />
              </View>
            )}
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
    backgroundColor: "#4299e1",
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
    paddingTop: 20,
  },
  dateSelector: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  dateOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateOptionActive: {
    backgroundColor: "#4299e1",
    borderColor: "#4299e1",
  },
  dateOptionText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  dateOptionTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  selectedDateInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
  },
  schedulesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  scheduleTimeContainer: {
    flex: 1,
    marginRight: 10,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 5,
  },
  actionButton: {
    padding: 8,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 5,
  },
  scheduleDescription: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
    marginBottom: 15,
  },
  scheduleDetails: {
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
    paddingHorizontal: 20,
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
  },
  createButton: {
    backgroundColor: "#4299e1",
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
    color: "#4299e1",
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
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ScheduleScreen;