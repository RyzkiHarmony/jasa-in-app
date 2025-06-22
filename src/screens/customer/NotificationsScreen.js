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
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatRelativeTimeJakarta } from "../../utils/dateUtils";

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadNotifications();
    });
    return unsubscribe;
  }, [navigation]);

  const loadNotifications = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT n.*, u.name as sender_name
         FROM notifications n
         LEFT JOIN users u ON n.sender_id = u.id
         WHERE n.receiver_id = ?
         ORDER BY n.created_at DESC`,
        [user.id]
      );
      setNotifications(result);

      // Mark all as read
      db.runSync(
        "UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0",
        [user.id]
      );
    } catch (error) {
      console.log("Error loading notifications:", error);
      Alert.alert("Error", "Gagal memuat notifikasi");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case "booking_status":
        navigation.navigate("BookingHistory");
        break;
      case "chat":
        navigation.getParent()?.navigate("ChatDetail", {
          chatId: notification.reference_id,
          umkmName: notification.sender_name,
        });
        break;
      case "review_reminder":
        navigation.navigate("ReviewForm", {
          bookingId: notification.reference_id,
        });
        break;
      case "promotion":
        navigation.navigate("UmkmDetail", {
          umkm: { id: notification.sender_id },
        });
        break;
      default:
        // Default action
        break;
    }
  };

  const deleteNotification = (notificationId) => {
    Alert.alert(
      "Hapus Notifikasi",
      "Apakah Anda yakin ingin menghapus notifikasi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync("DELETE FROM notifications WHERE id = ?", [
                notificationId,
              ]);
              loadNotifications();
            } catch (error) {
              console.log("Error deleting notification:", error);
              Alert.alert("Error", "Gagal menghapus notifikasi");
            }
          },
        },
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      "Hapus Semua Notifikasi",
      "Apakah Anda yakin ingin menghapus semua notifikasi?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Semua",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync("DELETE FROM notifications WHERE receiver_id = ?", [
                user.id,
              ]);
              setNotifications([]);
            } catch (error) {
              console.log("Error clearing notifications:", error);
              Alert.alert("Error", "Gagal menghapus notifikasi");
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp) => {
    return formatRelativeTimeJakarta(timestamp);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking_status":
        return "event-note";
      case "chat":
        return "chat";
      case "review_reminder":
        return "rate-review";
      case "promotion":
        return "local-offer";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "booking_status":
        return "#4299e1";
      case "chat":
        return "#48bb78";
      case "review_reminder":
        return "#f6ad55";
      case "promotion":
        return "#f56565";
      default:
        return "#a0aec0";
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) },
        ]}
      >
        <Icon
          name={getNotificationIcon(item.type)}
          size={24}
          color="white"
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
      >
        <Icon name="delete-outline" size={20} color="#a0aec0" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="notifications" size={24} color="white" />
            <View>
              <Text style={styles.headerTitle}>Notifikasi</Text>
              <Text style={styles.headerSubtitle}>
                Pemberitahuan dan pembaruan
              </Text>
            </View>
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearAllNotifications}
            >
              <Text style={styles.clearAllText}>Hapus Semua</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.notificationsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Tidak Ada Notifikasi</Text>
            <Text style={styles.emptyText}>
              Anda akan menerima notifikasi tentang booking, chat, dan promosi
              dari UMKM
            </Text>
          </View>
        )}
      </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    marginTop: 5,
    marginLeft: 12,
  },
  clearAllButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearAllText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: "white",
    marginBottom: 12,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#48bb78",
    backgroundColor: "#f0fff4",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: "#a0aec0",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
  },
  deleteButton: {
    padding: 10,
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
    paddingHorizontal: 20,
  },
});

export default NotificationsScreen;