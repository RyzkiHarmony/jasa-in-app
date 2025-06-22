import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";

const ChatScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadChats();
    });
    return unsubscribe;
  }, [navigation]);

  const loadChats = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT c.*, u.name as umkm_name, u.image as umkm_image,
               m.message as last_message, m.created_at as last_message_time,
               COUNT(CASE WHEN m.is_read = 0 AND m.sender_id != ? THEN 1 END) as unread_count
         FROM chats c
         JOIN users u ON c.umkm_id = u.id
         LEFT JOIN messages m ON c.id = m.chat_id
         WHERE c.customer_id = ?
         GROUP BY c.id
         ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
        [user.id, user.id]
      );
      setChats(result);
    } catch (error) {
      console.log("Error loading chats:", error);
      Alert.alert("Error", "Gagal memuat data chat");
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
      umkmName: chat.umkm_name,
      umkmImage: chat.umkm_image
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.chatImageContainer}>
        <Image
          source={{ uri: item.umkm_image || "https://via.placeholder.com/60" }}
          style={styles.chatImage}
        />
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unread_count > 99 ? "99+" : item.unread_count}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.umkm_name}</Text>
          <Text style={styles.chatTime}>
            {formatTime(item.last_message_time)}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.last_message || "Belum ada pesan"}
        </Text>
      </View>

      <Icon name="chevron-right" size={24} color="#6b7280" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="chat" size={24} color="white" />
            <View>
              <Text style={styles.headerTitle}>Chat</Text>
              <Text style={styles.headerSubtitle}>
                Komunikasi dengan UMKM
              </Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="message" size={20} color="white" />
            <Icon name="chat-bubble" size={18} color="white" />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {chats.length > 0 ? (
          <FlatList
            data={chats}
            renderItem={renderChat}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.chatsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="chat-bubble-outline" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Chat</Text>
            <Text style={styles.emptyText}>
              Mulai chat dengan UMKM melalui halaman detail UMKM atau setelah
              melakukan booking
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.exploreButtonText}>Jelajahi UMKM</Text>
            </TouchableOpacity>
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
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  chatsList: {
    paddingBottom: 20,
  },
  chatCard: {
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
  chatImageContainer: {
    position: "relative",
    marginRight: 15,
  },
  chatImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
  },
  unreadBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#f44336",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
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
  exploreButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;