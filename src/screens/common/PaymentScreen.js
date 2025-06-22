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
import { getCurrentJakartaTime, formatDateJakarta, formatPrice, toDBFormat } from "../../utils/dateUtils";

const PaymentScreen = ({ navigation, route }) => {
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [proofImage, setProofImage] = useState(null);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, completed, failed
  const { user } = useAuth();
  const { bookingId } = route.params || {};

  const paymentMethods = [
    { value: "cash", label: "Tunai", icon: "money", color: "#48bb78" },
    { value: "bank_transfer", label: "Transfer Bank", icon: "account-balance", color: "#4299e1" },
    { value: "e_wallet", label: "E-Wallet", icon: "account-balance-wallet", color: "#9f7aea" },
    { value: "credit_card", label: "Kartu Kredit", icon: "credit-card", color: "#f6ad55" },
  ];

  const paymentStatuses = [
    { value: "pending", label: "Menunggu", color: "#f6ad55" },
    { value: "completed", label: "Berhasil", color: "#48bb78" },
    { value: "failed", label: "Gagal", color: "#f56565" },
    { value: "refunded", label: "Dikembalikan", color: "#6b7280" },
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPayments();
    });
    return unsubscribe;
  }, [navigation, filter]);

  useEffect(() => {
    if (bookingId) {
      loadBookingForPayment(bookingId);
    }
  }, [bookingId]);

  const loadPayments = () => {
    try {
      const db = getDatabase();
      let query = "";
      let params = [];

      if (user.role === "customer") {
        // Customer melihat pembayaran mereka
        query = `
          SELECT p.*, b.service_id, s.name as service_name, u.business_name as umkm_name,
                 b.booking_date, b.total_price, b.status as booking_status
          FROM payments p
          JOIN bookings b ON p.booking_id = b.id
          JOIN services s ON b.service_id = s.id
          JOIN users u ON s.umkm_id = u.id
          WHERE b.customer_id = ?
        `;
        params = [user.id];
      } else {
        // UMKM melihat pembayaran untuk layanan mereka
        query = `
          SELECT p.*, b.service_id, s.name as service_name, cu.full_name as customer_name,
                 b.booking_date, b.total_price, b.status as booking_status
          FROM payments p
          JOIN bookings b ON p.booking_id = b.id
          JOIN services s ON b.service_id = s.id
          JOIN users cu ON b.customer_id = cu.id
          WHERE s.umkm_id = ?
        `;
        params = [user.id];
      }

      if (filter !== "all") {
        query += " AND p.status = ?";
        params.push(filter);
      }

      query += " ORDER BY p.created_at DESC";

      const result = db.getAllSync(query, params);
      setPayments(result);
    } catch (error) {
      console.log("Error loading payments:", error);
      Alert.alert("Error", "Gagal memuat data pembayaran");
    }
  };

  const loadBookingForPayment = (bookingId) => {
    try {
      const db = getDatabase();
      const booking = db.getFirstSync(
        `SELECT b.*, s.name as service_name, u.business_name as umkm_name
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN users u ON s.umkm_id = u.id
         WHERE b.id = ?`,
        [bookingId]
      );

      if (booking) {
        setSelectedBooking(booking);
        setModalVisible(true);
      }
    } catch (error) {
      console.log("Error loading booking:", error);
      Alert.alert("Error", "Gagal memuat data booking");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
    setRefreshing(false);
  };

  const openPaymentModal = (booking) => {
    setSelectedBooking(booking);
    setPaymentMethod("cash");
    setProofImage(null);
    setNotes("");
    setModalVisible(true);
  };

  const processPayment = () => {
    if (!selectedBooking) return;

    if (paymentMethod !== "cash" && !proofImage) {
      Alert.alert("Error", "Bukti pembayaran harus diupload untuk metode non-tunai");
      return;
    }

    try {
      const db = getDatabase();
      const now = toDBFormat(getCurrentJakartaTime());

      // Create payment record
      const paymentId = db.runSync(
        `INSERT INTO payments (booking_id, amount, method, status, proof_image, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          selectedBooking.id,
          selectedBooking.total_price,
          paymentMethod,
          paymentMethod === "cash" ? "completed" : "pending",
          proofImage,
          notes,
          now,
        ]
      ).lastInsertRowId;

      // Update booking status
      const newBookingStatus = paymentMethod === "cash" ? "confirmed" : "pending_payment";
      db.runSync(
        "UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?",
        [newBookingStatus, now, selectedBooking.id]
      );

      Alert.alert(
        "Berhasil",
        paymentMethod === "cash" 
          ? "Pembayaran tunai berhasil dicatat"
          : "Pembayaran berhasil disubmit, menunggu verifikasi"
      );
      
      setModalVisible(false);
      loadPayments();
    } catch (error) {
      console.log("Error processing payment:", error);
      Alert.alert("Error", "Gagal memproses pembayaran");
    }
  };

  const updatePaymentStatus = (paymentId, newStatus) => {
    const statusInfo = paymentStatuses.find(s => s.value === newStatus);
    Alert.alert(
      "Ubah Status Pembayaran",
      `Apakah Anda yakin ingin mengubah status menjadi ${statusInfo.label}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ubah",
          onPress: () => {
            try {
              const db = getDatabase();
              const now = toDBFormat(getCurrentJakartaTime());
              
              db.runSync(
                "UPDATE payments SET status = ?, updated_at = ? WHERE id = ?",
                [newStatus, now, paymentId]
              );
              
              // Update booking status based on payment status
              const payment = payments.find(p => p.id === paymentId);
              if (payment) {
                let bookingStatus = payment.booking_status;
                if (newStatus === "completed") {
                  bookingStatus = "confirmed";
                } else if (newStatus === "failed") {
                  bookingStatus = "cancelled";
                }
                
                db.runSync(
                  "UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?",
                  [bookingStatus, now, payment.booking_id]
                );
              }
              
              loadPayments();
              Alert.alert("Berhasil", "Status pembayaran berhasil diubah");
            } catch (error) {
              console.log("Error updating payment status:", error);
              Alert.alert("Error", "Gagal mengubah status pembayaran");
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

  const formatPriceLocal = (price) => {
    return formatPrice(price || 0);
  };

  const getMethodInfo = (method) => {
    return paymentMethods.find(m => m.value === method) || paymentMethods[0];
  };

  const getStatusInfo = (status) => {
    return paymentStatuses.find(s => s.value === status) || paymentStatuses[0];
  };

  const renderFilterTabs = () => {
    const tabs = [
      { key: "all", label: "Semua" },
      { key: "pending", label: "Menunggu" },
      { key: "completed", label: "Berhasil" },
      { key: "failed", label: "Gagal" },
    ];

    return (
      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>
      </View>
    );
  };

  const renderPayment = ({ item }) => {
    const methodInfo = getMethodInfo(item.method);
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            <Text style={styles.partnerName}>
              {user.role === "customer" ? item.umkm_name : item.customer_name}
            </Text>
            <Text style={styles.paymentDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.paymentBadges}>
            <View style={[styles.methodBadge, { backgroundColor: methodInfo.color }]}>
              <Icon name={methodInfo.icon} size={16} color="white" />
              <Text style={styles.badgeText}>{methodInfo.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.badgeText}>{statusInfo.label}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.paymentDetails}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Pembayaran</Text>
            <Text style={styles.amountValue}>{formatPriceLocal(item.amount)}</Text>
          </View>
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Catatan:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
          
          {item.proof_image && (
            <View style={styles.proofContainer}>
              <Text style={styles.proofLabel}>Bukti Pembayaran:</Text>
              <TouchableOpacity style={styles.proofButton}>
                <Icon name="image" size={16} color="#4299e1" />
                <Text style={styles.proofButtonText}>Lihat Bukti</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {user.role === "umkm" && item.status === "pending" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => updatePaymentStatus(item.id, "completed")}
            >
              <Icon name="check" size={16} color="white" />
              <Text style={styles.actionButtonText}>Terima</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => updatePaymentStatus(item.id, "failed")}
            >
              <Icon name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Tolak</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingInfoText}>
            Booking: {formatDate(item.booking_date)} • Status: {item.booking_status}
          </Text>
        </View>
      </View>
    );
  };

  const getPaymentStats = () => {
    const total = payments.reduce((sum, payment) => {
      return payment.status === "completed" ? sum + payment.amount : sum;
    }, 0);
    
    const pending = payments.filter(p => p.status === "pending").length;
    const completed = payments.filter(p => p.status === "completed").length;
    
    return { total, pending, completed };
  };

  const renderStats = () => {
    const stats = getPaymentStats();
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{formatPriceLocal(stats.total)}</Text>
          <Text style={styles.statLabel}>Total Diterima</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Berhasil</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Menunggu</Text>
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
            <Text style={styles.headerTitle}>Pembayaran</Text>
            <Text style={styles.headerSubtitle}>
              {user.role === "customer" ? "Riwayat Pembayaran" : "Kelola Pembayaran"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {renderFilterTabs()}
        {renderStats()}

        {payments.length > 0 ? (
          <FlatList
            data={payments}
            renderItem={renderPayment}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.paymentsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="payment" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Pembayaran</Text>
            <Text style={styles.emptyText}>
              {user.role === "customer"
                ? "Anda belum melakukan pembayaran apapun"
                : "Belum ada pembayaran dari pelanggan"
              }
            </Text>
          </View>
        )}
      </View>

      {/* Payment Modal */}
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
            <Text style={styles.modalTitle}>Proses Pembayaran</Text>
            <TouchableOpacity onPress={processPayment}>
              <Text style={styles.processButton}>Bayar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedBooking && (
              <View style={styles.bookingDetails}>
                <Text style={styles.bookingServiceName}>
                  {selectedBooking.service_name}
                </Text>
                <Text style={styles.bookingUmkmName}>
                  {selectedBooking.umkm_name}
                </Text>
                <Text style={styles.bookingDatePrice}>
                  {formatDate(selectedBooking.booking_date)}
                </Text>
                <Text style={styles.totalAmount}>
                  {formatPriceLocal(selectedBooking.total_price)}
                </Text>
              </View>
            )}

            <View style={styles.methodSection}>
              <Text style={styles.methodLabel}>Metode Pembayaran</Text>
              <View style={styles.methodSelector}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.methodOption,
                      { borderColor: method.color },
                      paymentMethod === method.value && { backgroundColor: method.color }
                    ]}
                    onPress={() => setPaymentMethod(method.value)}
                  >
                    <Icon 
                      name={method.icon} 
                      size={20} 
                      color={paymentMethod === method.value ? "white" : method.color} 
                    />
                    <Text style={[
                      styles.methodOptionText,
                      { color: paymentMethod === method.value ? "white" : method.color }
                    ]}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {paymentMethod !== "cash" && (
              <View style={styles.proofSection}>
                <Text style={styles.proofLabel}>Bukti Pembayaran *</Text>
                <TouchableOpacity style={styles.uploadButton}>
                  <Icon name="cloud-upload" size={24} color="#6b7280" />
                  <Text style={styles.uploadButtonText}>
                    {proofImage ? "Ganti Bukti" : "Upload Bukti Pembayaran"}
                  </Text>
                </TouchableOpacity>
                {proofImage && (
                  <Text style={styles.uploadedText}>✓ Bukti berhasil diupload</Text>
                )}
              </View>
            )}

            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Catatan (Opsional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Tambahkan catatan pembayaran..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {paymentMethod !== "cash" && (
              <View style={styles.infoSection}>
                <View style={styles.infoCard}>
                  <Icon name="info" size={20} color="#4299e1" />
                  <Text style={styles.infoText}>
                    Pembayaran non-tunai akan diverifikasi oleh UMKM. 
                    Status booking akan berubah setelah pembayaran dikonfirmasi.
                  </Text>
                </View>
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
    backgroundColor: "#10b981",
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
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
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
  },
  paymentsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  paymentInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 2,
  },
  partnerName: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  paymentBadges: {
    alignItems: "flex-end",
    gap: 5,
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  paymentDetails: {
    marginBottom: 15,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
  },
  notesContainer: {
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 14,
    color: "#2d3748",
  },
  proofContainer: {
    marginBottom: 10,
  },
  proofLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  proofButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  proofButtonText: {
    fontSize: 14,
    color: "#4299e1",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  approveButton: {
    backgroundColor: "#48bb78",
  },
  rejectButton: {
    backgroundColor: "#f56565",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  bookingInfo: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  bookingInfoText: {
    fontSize: 12,
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
  processButton: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  bookingDetails: {
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
    marginBottom: 10,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
  },
  methodSection: {
    marginBottom: 20,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 15,
  },
  methodSelector: {
    gap: 10,
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderRadius: 10,
    gap: 10,
  },
  methodOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  proofSection: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 10,
    gap: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  uploadedText: {
    fontSize: 12,
    color: "#48bb78",
    marginTop: 5,
    textAlign: "center",
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    backgroundColor: "white",
    height: 80,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
});

export default PaymentScreen;