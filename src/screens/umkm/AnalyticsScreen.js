import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const AnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    monthlyBookings: 0,
    averageRating: 0,
    totalReviews: 0,
    popularServices: [],
    monthlyStats: [],
    customerStats: {
      newCustomers: 0,
      returningCustomers: 0,
    },
  });
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const periods = [
    { key: "week", label: "Minggu Ini" },
    { key: "month", label: "Bulan Ini" },
    { key: "quarter", label: "3 Bulan" },
    { key: "year", label: "Tahun Ini" },
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadAnalytics();
    });
    return unsubscribe;
  }, [navigation, selectedPeriod]);

  const loadAnalytics = () => {
    try {
      const db = getDatabase();
      
      // Get date range based on selected period
      const now = new Date();
      let startDate;
      
      switch (selectedPeriod) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Total revenue
      const totalRevenueResult = db.getAllSync(
        `SELECT COALESCE(SUM(b.total_price), 0) as revenue 
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND b.status = 'completed'`,
        [user.id]
      );
      
      // Period revenue
      const periodRevenueResult = db.getAllSync(
        `SELECT COALESCE(SUM(b.total_price), 0) as revenue 
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND b.status = 'completed' 
         AND DATE(b.created_at) >= ?`,
        [user.id, startDateStr]
      );
      
      // Total bookings
      const totalBookingsResult = db.getAllSync(
        `SELECT COUNT(*) as total 
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ?`,
        [user.id]
      );
      
      // Period bookings
      const periodBookingsResult = db.getAllSync(
        `SELECT COUNT(*) as total 
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND DATE(b.created_at) >= ?`,
        [user.id, startDateStr]
      );
      
      // Average rating and reviews
      const ratingResult = db.getAllSync(
        `SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as total_reviews
         FROM reviews r
         JOIN services s ON r.service_id = s.id
         WHERE s.umkm_id = ?`,
        [user.id]
      );
      
      // Popular services
      const popularServicesResult = db.getAllSync(
        `SELECT s.name, s.category, COUNT(b.id) as booking_count,
                AVG(r.rating) as avg_rating, s.price
         FROM services s
         LEFT JOIN bookings b ON s.id = b.service_id
         LEFT JOIN reviews r ON s.id = r.service_id
         WHERE s.umkm_id = ?
         GROUP BY s.id
         ORDER BY booking_count DESC
         LIMIT 5`,
        [user.id]
      );
      
      // Customer stats
      const newCustomersResult = db.getAllSync(
        `SELECT COUNT(DISTINCT b.customer_id) as new_customers
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND DATE(b.created_at) >= ?
         AND b.customer_id NOT IN (
           SELECT DISTINCT b2.customer_id
           FROM bookings b2
           JOIN services s2 ON b2.service_id = s2.id
           WHERE s2.umkm_id = ? AND DATE(b2.created_at) < ?
         )`,
        [user.id, startDateStr, user.id, startDateStr]
      );
      
      const returningCustomersResult = db.getAllSync(
        `SELECT COUNT(DISTINCT b.customer_id) as returning_customers
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE s.umkm_id = ? AND DATE(b.created_at) >= ?
         AND b.customer_id IN (
           SELECT DISTINCT b2.customer_id
           FROM bookings b2
           JOIN services s2 ON b2.service_id = s2.id
           WHERE s2.umkm_id = ? AND DATE(b2.created_at) < ?
         )`,
        [user.id, startDateStr, user.id, startDateStr]
      );
      
      setAnalytics({
        totalRevenue: totalRevenueResult[0]?.revenue || 0,
        monthlyRevenue: periodRevenueResult[0]?.revenue || 0,
        totalBookings: totalBookingsResult[0]?.total || 0,
        monthlyBookings: periodBookingsResult[0]?.total || 0,
        averageRating: ratingResult[0]?.avg_rating || 0,
        totalReviews: ratingResult[0]?.total_reviews || 0,
        popularServices: popularServicesResult || [],
        customerStats: {
          newCustomers: newCustomersResult[0]?.new_customers || 0,
          returningCustomers: returningCustomersResult[0]?.returning_customers || 0,
        },
      });
    } catch (error) {
      console.log("Error loading analytics:", error);
      Alert.alert("Error", "Gagal memuat data analitik");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, subtitle, color, iconName, trend }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={iconName} size={24} color={color} />
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#c6f6d5' : '#fed7d7' }]}>
            <Icon 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={trend > 0 ? '#38a169' : '#e53e3e'} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? '#38a169' : '#e53e3e' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ServiceCard = ({ service, index }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceRank}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceCategory}>{service.category}</Text>
        <View style={styles.serviceStats}>
          <View style={styles.statItem}>
            <Icon name="event" size={16} color="#6b7280" />
            <Text style={styles.statText}>{service.booking_count || 0} booking</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={16} color="#fbbf24" />
            <Text style={styles.statText}>
              {service.avg_rating ? service.avg_rating.toFixed(1) : '0.0'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.servicePrice}>
        Rp {service.price ? service.price.toLocaleString() : '0'}
      </Text>
    </View>
  );

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
            <Text style={styles.headerTitle}>Analitik Bisnis</Text>
            <Text style={styles.headerSubtitle}>Laporan performa UMKM</Text>
          </View>
          <Icon name="analytics" size={24} color="white" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.periodOptions}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodOption,
                    selectedPeriod === period.key && styles.periodOptionActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      selectedPeriod === period.key && styles.periodOptionTextActive,
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Revenue Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendapatan</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Pendapatan"
              value={`Rp ${analytics.totalRevenue.toLocaleString()}`}
              color="#48bb78"
              iconName="attach-money"
            />
            <StatCard
              title="Pendapatan Periode"
              value={`Rp ${analytics.monthlyRevenue.toLocaleString()}`}
              color="#4299e1"
              iconName="trending-up"
            />
          </View>
        </View>

        {/* Booking Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Booking"
              value={analytics.totalBookings.toString()}
              color="#9f7aea"
              iconName="event-note"
            />
            <StatCard
              title="Booking Periode"
              value={analytics.monthlyBookings.toString()}
              color="#f6ad55"
              iconName="event"
            />
          </View>
        </View>

        {/* Rating & Customer Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating & Pelanggan</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Rating Rata-rata"
              value={analytics.averageRating ? analytics.averageRating.toFixed(1) : '0.0'}
              subtitle={`${analytics.totalReviews} ulasan`}
              color="#fbbf24"
              iconName="star"
            />
            <StatCard
              title="Pelanggan Baru"
              value={analytics.customerStats.newCustomers.toString()}
              subtitle={`${analytics.customerStats.returningCustomers} pelanggan kembali`}
              color="#f56565"
              iconName="person-add"
            />
          </View>
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Layanan Populer</Text>
          {analytics.popularServices.length > 0 ? (
            analytics.popularServices.map((service, index) => (
              <ServiceCard key={index} service={service} index={index} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="trending-up" size={40} color="#e2e8f0" />
              <Text style={styles.emptyText}>Belum ada data layanan</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    marginTop: 20,
    marginBottom: 20,
  },
  periodOptions: {
    flexDirection: "row",
    gap: 10,
  },
  periodOption: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  periodOptionActive: {
    backgroundColor: "#48bb78",
    borderColor: "#48bb78",
  },
  periodOptionText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  periodOptionTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 15,
  },
  statsGrid: {
    gap: 15,
  },
  statCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "600",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#a0aec0",
    marginTop: 2,
  },
  serviceCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  serviceRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#48bb78",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rankNumber: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 2,
  },
  serviceCategory: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  serviceStats: {
    flexDirection: "row",
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#48bb78",
  },
  emptyState: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  emptyText: {
    fontSize: 14,
    color: "#718096",
    marginTop: 10,
  },
});

export default AnalyticsScreen;