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
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { getCurrentJakartaTime, formatDateJakarta } from "../../utils/dateUtils";

const ReviewsScreen = ({ navigation, route }) => {
  const [reviews, setReviews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const { user } = useAuth();
  const { umkmId, serviceId } = route.params || {};

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadReviews();
    });
    return unsubscribe;
  }, [navigation, filter]);

  const loadReviews = () => {
    try {
      const db = getDatabase();
      let query = "";
      let params = [];

      if (user.role === "customer") {
        // Customer melihat review yang mereka buat
        query = `
          SELECT r.*, b.service_id, s.name as service_name, u.business_name as umkm_name,
                 b.booking_date, b.total_price
          FROM reviews r
          JOIN bookings b ON r.booking_id = b.id
          JOIN services s ON b.service_id = s.id
          JOIN users u ON s.umkm_id = u.id
          WHERE b.customer_id = ?
        `;
        params = [user.id];
      } else {
        // UMKM melihat review untuk layanan mereka
        query = `
          SELECT r.*, b.service_id, s.name as service_name, cu.full_name as customer_name,
                 b.booking_date, b.total_price
          FROM reviews r
          JOIN bookings b ON r.booking_id = b.id
          JOIN services s ON b.service_id = s.id
          JOIN users cu ON b.customer_id = cu.id
          WHERE s.umkm_id = ?
        `;
        params = [user.id];
      }

      if (umkmId) {
        query += " AND s.umkm_id = ?";
        params.push(umkmId);
      }

      if (serviceId) {
        query += " AND b.service_id = ?";
        params.push(serviceId);
      }

      query += " ORDER BY r.created_at DESC";

      const result = db.getAllSync(query, params);
      setReviews(result);

      // Load pending reviews for customers
      if (user.role === "customer") {
        loadPendingReviews();
      }
    } catch (error) {
      console.log("Error loading reviews:", error);
      Alert.alert("Error", "Gagal memuat data review");
    }
  };

  const loadPendingReviews = () => {
    try {
      const db = getDatabase();
      const pendingBookings = db.getAllSync(
        `SELECT b.*, s.name as service_name, u.business_name as umkm_name
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN users u ON s.umkm_id = u.id
         LEFT JOIN reviews r ON b.id = r.booking_id
         WHERE b.customer_id = ? AND b.status = 'completed' AND r.id IS NULL
         ORDER BY b.booking_date DESC`,
        [user.id]
      );

      if (filter === "pending") {
        setReviews(pendingBookings.map(booking => ({
          ...booking,
          isPending: true,
        })));
      }
    } catch (error) {
      console.log("Error loading pending reviews:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
    setRefreshing(false);
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment("");
    setModalVisible(true);
  };

  const submitReview = () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Komentar harus diisi");
      return;
    }

    try {
      const db = getDatabase();
      const now = getCurrentJakartaTime().toISOString();

      db.runSync(
        `INSERT INTO reviews (booking_id, rating, comment, created_at)
         VALUES (?, ?, ?, ?)`,
        [selectedBooking.id, rating, comment, now]
      );

      Alert.alert("Berhasil", "Review berhasil dikirim");
      setModalVisible(false);
      loadReviews();
    } catch (error) {
      console.log("Error submitting review:", error);
      Alert.alert("Error", "Gagal mengirim review");
    }
  };

  const deleteReview = (reviewId) => {
    Alert.alert(
      "Hapus Review",
      "Apakah Anda yakin ingin menghapus review ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync("DELETE FROM reviews WHERE id = ?", [reviewId]);
              loadReviews();
              Alert.alert("Berhasil", "Review berhasil dihapus");
            } catch (error) {
              console.log("Error deleting review:", error);
              Alert.alert("Error", "Gagal menghapus review");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return formatDateJakarta(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return `Rp ${price?.toLocaleString('id-ID') || 0}`;
  };

  const renderStars = (rating, size = 16, interactive = false, onPress = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => interactive && onPress && onPress(i)}
          disabled={!interactive}
        >
          <Icon
            name={i <= rating ? "star" : "star-border"}
            size={size}
            color={i <= rating ? "#fbbf24" : "#d1d5db"}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderFilterTabs = () => {
    const tabs = [
      { key: "all", label: "Semua Review" },
      { key: "pending", label: "Belum Direview" },
    ];

    if (user.role !== "customer") {
      return null;
    }

    return (
      <View style={styles.filterTabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.filterTabActive
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab.key && styles.filterTabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReview = ({ item }) => {
    if (item.isPending) {
      // Render pending review item
      return (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewInfo}>
              <Text style={styles.serviceName}>{item.service_name}</Text>
              <Text style={styles.umkmName}>{item.umkm_name}</Text>
              <Text style={styles.bookingDate}>
                {formatDate(item.booking_date)}
              </Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Belum Direview</Text>
            </View>
          </View>
          
          <View style={styles.bookingDetails}>
            <Text style={styles.totalPrice}>{formatPrice(item.total_price)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => openReviewModal(item)}
          >
            <Icon name="rate-review" size={20} color="white" />
            <Text style={styles.reviewButtonText}>Beri Review</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Render completed review item
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewInfo}>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            <Text style={styles.reviewerName}>
              {user.role === "customer" ? item.umkm_name : item.customer_name}
            </Text>
            <Text style={styles.reviewDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.reviewActions}>
            {renderStars(item.rating, 18)}
            {user.role === "customer" && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteReview(item.id)}
              >
                <Icon name="delete" size={20} color="#f56565" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <Text style={styles.reviewComment}>{item.comment}</Text>
        
        <View style={styles.reviewFooter}>
          <Text style={styles.bookingInfo}>
            Booking: {formatDate(item.booking_date)} • {formatPrice(item.total_price)}
          </Text>
        </View>
      </View>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const validReviews = reviews.filter(r => !r.isPending && r.rating);
    if (validReviews.length === 0) return 0;
    const sum = validReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / validReviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const validReviews = reviews.filter(r => !r.isPending && r.rating);
    
    validReviews.forEach(review => {
      distribution[review.rating]++;
    });
    
    return distribution;
  };

  const renderStats = () => {
    const avgRating = getAverageRating();
    const distribution = getRatingDistribution();
    const totalReviews = reviews.filter(r => !r.isPending).length;

    if (totalReviews === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.averageRating}>
          <Text style={styles.avgRatingNumber}>{avgRating}</Text>
          {renderStars(Math.round(avgRating), 20)}
          <Text style={styles.totalReviews}>{totalReviews} review</Text>
        </View>
        
        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map(star => (
            <View key={star} style={styles.distributionRow}>
              <Text style={styles.starLabel}>{star}</Text>
              <Icon name="star" size={16} color="#fbbf24" />
              <View style={styles.distributionBar}>
                <View 
                  style={[
                    styles.distributionFill,
                    { width: `${totalReviews > 0 ? (distribution[star] / totalReviews) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.distributionCount}>{distribution[star]}</Text>
            </View>
          ))}
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
            <Text style={styles.headerTitle}>Review & Rating</Text>
            <Text style={styles.headerSubtitle}>
              {user.role === "customer" ? "Review Anda" : "Review Pelanggan"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {renderFilterTabs()}
        {filter === "all" && renderStats()}

        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => 
              item.isPending ? `pending-${item.id}` : `review-${item.id}`
            }
            contentContainerStyle={styles.reviewsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="rate-review" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>
              {filter === "pending" ? "Tidak Ada Review Pending" : "Belum Ada Review"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "pending" 
                ? "Semua booking sudah direview"
                : user.role === "customer"
                ? "Anda belum memberikan review untuk layanan apapun"
                : "Belum ada pelanggan yang memberikan review"
              }
            </Text>
          </View>
        )}
      </View>

      {/* Review Modal */}
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
            <Text style={styles.modalTitle}>Beri Review</Text>
            <TouchableOpacity onPress={submitReview}>
              <Text style={styles.submitButton}>Kirim</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedBooking && (
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingServiceName}>
                  {selectedBooking.service_name}
                </Text>
                <Text style={styles.bookingUmkmName}>
                  {selectedBooking.umkm_name}
                </Text>
                <Text style={styles.bookingDatePrice}>
                  {formatDate(selectedBooking.booking_date)} • {formatPrice(selectedBooking.total_price)}
                </Text>
              </View>
            )}

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Rating</Text>
              <View style={styles.ratingSelector}>
                {renderStars(rating, 32, true, setRating)}
              </View>
              <Text style={styles.ratingText}>
                {rating === 5 ? "Sangat Puas" :
                 rating === 4 ? "Puas" :
                 rating === 3 ? "Cukup" :
                 rating === 2 ? "Kurang" : "Sangat Kurang"}
              </Text>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Komentar</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Bagikan pengalaman Anda..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
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
    backgroundColor: "#f6ad55",
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
    paddingTop: 20,
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#f6ad55",
    borderColor: "#f6ad55",
  },
  filterTabText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  statsContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  averageRating: {
    alignItems: "center",
    marginBottom: 20,
  },
  avgRatingNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  totalReviews: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5,
  },
  ratingDistribution: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starLabel: {
    fontSize: 14,
    color: "#2d3748",
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    backgroundColor: "#fbbf24",
  },
  distributionCount: {
    fontSize: 12,
    color: "#6b7280",
    width: 20,
    textAlign: "right",
  },
  reviewsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  reviewInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 2,
  },
  umkmName: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 2,
  },
  reviewerName: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  reviewDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  reviewActions: {
    alignItems: "flex-end",
    gap: 5,
  },
  pendingBadge: {
    backgroundColor: "#f6ad55",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: "#2d3748",
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  bookingInfo: {
    fontSize: 12,
    color: "#6b7280",
  },
  bookingDetails: {
    marginBottom: 15,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#48bb78",
  },
  reviewButton: {
    backgroundColor: "#f6ad55",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  reviewButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
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
  submitButton: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f6ad55",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  bookingInfo: {
    backgroundColor: "#f7fafc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  bookingServiceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  bookingUmkmName: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 5,
  },
  bookingDatePrice: {
    fontSize: 12,
    color: "#6b7280",
  },
  ratingSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 15,
  },
  ratingSelector: {
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    backgroundColor: "white",
    height: 120,
  },
});

export default ReviewsScreen;