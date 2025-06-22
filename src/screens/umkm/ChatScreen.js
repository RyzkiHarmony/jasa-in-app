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

const ChatScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT c.*, u.name as customer_name, u.email as customer_email
         FROM chats c
         JOIN users u ON c.customer_id = u.id
         WHERE c.umkm_id = ?
         ORDER BY c.last_message_time DESC`,
        [user.id]
      );
      setChats(result);
    } catch (error) {
      console.log("Error loading chats:", error);
      Alert.alert("Error", "Gagal memuat daftar chat");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    navigation.getParent()?.navigate("ChatDetail", {
      chatId: chat.id,
      umkmName: chat.customer_name,
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Hari ini";
    } else if (diffDays === 2) {
      return "Kemarin";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} hari lalu`;
    } else {
      return date.toLocaleDateString("id-ID");
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.customer_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          <Text style={styles.chatTime}>
            {formatTime(item.last_message_time)}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || "Belum ada pesan"}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unread_count > 99 ? "99+" : item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chat-bubble-outline" size={80} color="#9ca3af" />
      <Text style={styles.emptyTitle}>Belum Ada Chat</Text>
      <Text style={styles.emptySubtitle}>
        Chat akan muncul ketika customer mengirim pesan kepada Anda
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Customer</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatItem}
        style={styles.chatList}
        contentContainerStyle={chats.length === 0 ? styles.emptyList : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  chatList: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#48bb78",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  chatTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default ChatScreen;