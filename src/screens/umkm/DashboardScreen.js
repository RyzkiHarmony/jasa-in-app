import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalServices: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadDashboardData = () => {
    loadStats();
    loadRecentBookings();
  };

  const loadStats = () => {
    try {
      const db = getDatabase();

      // Get total bookings
      const totalBookingsResult = db.getAllSync(
        `SELECT COUNT(*) as total FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ?`,
        [user.id]
      );
      const totalBookings = totalBookingsResult[0]?.total || 0;

      // Get pending bookings
      const pendingBookingsResult = db.getAllSync(
        `SELECT COUNT(*) as pending FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND b.status = 'pending'`,
        [user.id]
      );
      const pendingBookings = pendingBookingsResult[0]?.pending || 0;

      // Get completed bookings
      const completedBookingsResult = db.getAllSync(
        `SELECT COUNT(*) as completed FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND b.status = 'completed'`,
        [user.id]
      );
      const completedBookings = completedBookingsResult[0]?.completed || 0;

      // Get total revenue
      const totalRevenueResult = db.getAllSync(
        `SELECT COALESCE(SUM(b.total_price), 0) as revenue FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND b.status = 'completed'`,
        [user.id]
      );
      const totalRevenue = totalRevenueResult[0]?.revenue || 0;

      // Get total services
      const totalServicesResult = db.getAllSync(
        "SELECT COUNT(*) as total FROM services WHERE umkm_id = ?",
        [user.id]
      );
      const totalServices = totalServicesResult[0]?.total || 0;

      setStats({
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        totalServices,
      });
    } catch (error) {
      console.log("Error loading stats:", error);
    }
  };

  const loadRecentBookings = () => {
    try {
      const db = getDatabase();
      const bookingsData = db.getAllSync(
        `SELECT b.*, s.name as service_name, u.name as customer_name
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN users u ON b.customer_id = u.id
         WHERE s.umkm_id = ?
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [user.id]
      );
      setRecentBookings(bookingsData);
    } catch (error) {
      console.log("Error loading recent bookings:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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

  const StatCard = ({ title, value, color, iconName }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={iconName} size={24} color={color} style={styles.statIcon} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon
              name="dashboard"
              size={24}
              color="white"
              style={styles.dashboardIcon}
            />
            <View>
              <Text style={styles.headerTitle}>Dashboard UMKM</Text>
              <Text style={styles.headerSubtitle}>Halo, {user?.name}!</Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon
              name="business"
              size={20}
              color="white"
              style={styles.businessIcon}
            />
            <Icon
              name="trending-up"
              size={18}
              color="white"
              style={styles.successIcon}
            />
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Booking"
          value={stats.totalBookings}
          color="#48bb78"
          iconName="event"
        />

        <StatCard
          title="Menunggu"
          value={stats.pendingBookings}
          color="#ff9800"
          iconName="schedule"
        />

        <StatCard
          title="Selesai"
          value={stats.completedBookings}
          color="#48bb78"
          iconName="check-circle"
        />

        <StatCard
          title="Total Pendapatan"
          value={`Rp ${stats.totalRevenue.toLocaleString()}`}
          color="#9c27b0"
          iconName="attach-money"
        />

        <StatCard
          title="Total Layanan"
          value={stats.totalServices}
          color="#ff5722"
          iconName="build"
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("ManageBookings")}
          >
            <Icon
              name="event"
              size={24}
              color="#48bb78"
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Kelola Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("ManageServices")}
          >
            <Icon
              name="build"
              size={24}
              color="#48bb78"
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Kelola Layanan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recentBookings}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking Terbaru</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("ManageBookings")}
          >
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length > 0 ? (
          recentBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingService}>
                  {booking.service_name}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(booking.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.bookingCustomer}>
                Customer: {booking.customer_name}
              </Text>
              <View style={styles.dateRow}>
                <Icon name="event" size={16} color="#48bb78" />
                <Text style={styles.dateText}>
                  {new Date(booking.booking_date).toLocaleDateString("id-ID")}
                </Text>
              </View>
              <Text style={styles.bookingPrice}>
                Rp {booking.total_price.toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Belum ada booking</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  dashboardIcon: {
    marginRight: 12,
  },
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessIcon: {
    marginRight: 8,
  },
  successIcon: {},
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    marginTop: 5,
  },
  statsContainer: {
    padding: 20,
    gap: 18,
  },
  statCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6,
    elevation: 8,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f8f0",
  },
  statIcon: {
    fontSize: 28,
    marginRight: 18,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statTitle: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
    fontWeight: "600",
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "white",
    padding: 28,
    borderRadius: 25,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e8f5e8",
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    textAlign: "center",
  },
  recentBookings: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: "#48bb78",
    fontWeight: "600",
  },
  bookingCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 6,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f8f0",
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookingCustomer: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 5,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  bookingDate: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 5,
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#48bb78",
  },
  emptyState: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
});

export default DashboardScreen;
