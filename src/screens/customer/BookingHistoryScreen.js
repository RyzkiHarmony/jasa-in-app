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
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const BookingHistoryScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadBookings();
    });

    return unsubscribe;
  }, [navigation]);

  const loadBookings = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT b.*, s.name as service_name, s.description, u.name as umkm_name
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN users u ON s.umkm_id = u.id
         WHERE b.customer_id = ?
         ORDER BY b.created_at DESC`,
        [user.id]
      );
      setBookings(result);
    } catch (error) {
      console.log("Error loading bookings:", error);
      Alert.alert("Error", "Gagal memuat riwayat booking");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
    setRefreshing(false);
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

  const handleReview = (booking) => {
    if (booking.status === "completed") {
      navigation.navigate("ReviewForm", { booking });
    } else {
      Alert.alert(
        "Info",
        "Review hanya bisa diberikan setelah layanan selesai"
      );
    }
  };

  const renderBooking = ({ item }) => (
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

      <Text style={styles.umkmName}>{item.umkm_name}</Text>
      <View style={styles.dateRow}>
        <Icon name="event" size={16} color="#48bb78" />
        <Text style={styles.dateText}>
          {new Date(item.booking_date).toLocaleDateString("id-ID", {
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
        <Text style={styles.price}>Rp {item.total_price.toLocaleString()}</Text>

        {item.status === "completed" && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => handleReview(item)}
          >
            <Text style={styles.reviewButtonText}>Beri Review</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.createdAt}>
        Dibuat: {new Date(item.created_at).toLocaleDateString("id-ID")}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="history" size={30} color="white" />
            <View>
              <Text style={styles.headerTitle}>Riwayat Booking</Text>
              <Text style={styles.headerSubtitle}>Kelola booking Anda</Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="access-time" size={24} color="white" />
            <Icon name="check-circle" size={24} color="white" />
          </View>
        </View>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        contentContainerStyle={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada booking</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.exploreButtonText}>Jelajahi Jasa</Text>
            </TouchableOpacity>
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
  historyIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
  },
  clockIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  checkIcon: {
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
    marginBottom: 5,
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
  umkmName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#48bb78",
  },
  reviewButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reviewButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  createdAt: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
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
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 6,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default BookingHistoryScreen;
