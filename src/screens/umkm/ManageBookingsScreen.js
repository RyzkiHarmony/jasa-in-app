import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatDateJakarta, formatPrice } from "../../utils/dateUtils";
import Icon from "react-native-vector-icons/MaterialIcons";

const ManageBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadBookings();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter]);

  const loadBookings = () => {
    try {
      const db = getDatabase();
      const bookingsData = db.getAllSync(
        `SELECT b.*, s.name as service_name, s.description, u.name as customer_name, u.phone as customer_phone
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN users u ON b.customer_id = u.id
         WHERE s.umkm_id = ?
         ORDER BY b.created_at DESC`,
        [user.id]
      );
      setBookings(bookingsData);
    } catch (error) {
      console.log("Error loading bookings:", error);
      Alert.alert("Error", "Gagal memuat data booking");
    }
  };

  const filterBookings = () => {
    if (statusFilter === "all") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter((booking) => booking.status === statusFilter)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
    setRefreshing(false);
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    try {
      const db = getDatabase();
      db.runSync("UPDATE bookings SET status = ? WHERE id = ?", [
        newStatus,
        bookingId,
      ]);
      loadBookings();
      Alert.alert(
        "Sukses",
        `Status booking berhasil diubah menjadi ${getStatusText(newStatus)}`
      );
    } catch (error) {
      console.log("Error updating booking status:", error);
      Alert.alert("Error", "Gagal mengubah status booking");
    }
  };

  const handleStatusChange = (booking, newStatus) => {
    const statusText = getStatusText(newStatus);
    Alert.alert(
      "Konfirmasi",
      `Apakah Anda yakin ingin mengubah status booking menjadi "${statusText}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya",
          onPress: () => updateBookingStatus(booking.id, newStatus),
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ff9800";
      case "confirmed":
        return "#48bb78";
      case "completed":
        return "#48bb78";
      case "cancelled":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "confirmed":
        return "Dikonfirmasi";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getAvailableActions = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return [
          { status: "confirmed", text: "Konfirmasi", color: "#48bb78" },
          { status: "cancelled", text: "Tolak", color: "#f44336" },
        ];
      case "confirmed":
        return [
          { status: "completed", text: "Selesai", color: "#48bb78" },
          { status: "cancelled", text: "Batal", color: "#f44336" },
        ];
      default:
        return [];
    }
  };

  const renderBooking = ({ item }) => {
    const availableActions = getAvailableActions(item.status);

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.serviceName}>{item.service_name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <View style={styles.infoRow}>
            <Icon name="person" size={16} color="#48bb78" />
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color="#48bb78" />
            <Text style={styles.customerPhone}>{item.customer_phone}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="event" size={16} color="#48bb78" />
          <Text style={styles.bookingDate}>
            {formatDateJakarta(item.booking_date, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.price}>
            {formatPrice(item.total_price)}
          </Text>
          <Text style={styles.createdAt}>
            Dibuat: {formatDateJakarta(item.created_at)}
          </Text>
        </View>

        {availableActions.length > 0 && (
          <View style={styles.actionsContainer}>
            {availableActions.map((action) => (
              <TouchableOpacity
                key={action.status}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={() => handleStatusChange(item, action.status)}
              >
                <Text style={styles.actionButtonText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="event-note" size={30} color="white" />
            <View>
              <Text style={styles.headerTitle}>Kelola Booking</Text>
              <Text style={styles.headerSubtitle}>
                Kelola pesanan dari customer
              </Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon
              name="settings"
              size={24}
              color="white"
              style={styles.manageIcon}
            />
            <Icon name="inventory" size={24} color="white" />
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter Status:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={statusFilter}
            onValueChange={setStatusFilter}
            style={styles.picker}
          >
            <Picker.Item label="Semua" value="all" />
            <Picker.Item label="Menunggu" value="pending" />
            <Picker.Item label="Dikonfirmasi" value="confirmed" />
            <Picker.Item label="Selesai" value="completed" />
            <Picker.Item label="Dibatalkan" value="cancelled" />
          </Picker>
        </View>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        contentContainerStyle={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {statusFilter === "all"
                ? "Belum ada booking"
                : `Tidak ada booking dengan status "${getStatusText(
                    statusFilter
                  )}"`}
            </Text>
          </View>
        }
      />
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  bookingIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
  },
  manageIcon: {
    marginRight: 8,
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
  filterContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5e8",
    elevation: 2,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterLabel: {
    fontSize: 14,
    color: "#2d3748",
    marginBottom: 8,
    fontWeight: "600",
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: "#c6f6d5",
    borderRadius: 15,
    backgroundColor: "#f8fcff",
    elevation: 2,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  picker: {
    height: 50,
  },
  bookingsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bookingCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 25,
    marginBottom: 18,
    elevation: 6,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e8f5e8",
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  customerInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: "#48bb78",
    marginLeft: 8,
    fontWeight: "500",
  },
  customerPhone: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    marginBottom: 10,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#48bb78",
  },
  createdAt: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  actionButtonText: {
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
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default ManageBookingsScreen;
