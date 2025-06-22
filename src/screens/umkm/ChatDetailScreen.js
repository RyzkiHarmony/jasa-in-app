import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatTimeJakarta } from "../../utils/dateUtils";

const ChatDetailScreen = ({ route, navigation }) => {
  const { chatId, umkmName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT m.*, 
                CASE 
                  WHEN m.sender_type = 'umkm' THEN 'Anda'
                  ELSE ? 
                END as sender_name
         FROM messages m 
         WHERE m.chat_id = ? 
         ORDER BY m.created_at ASC`,
        [umkmName, chatId]
      );
      setMessages(result);
      
      // Mark messages as read
      db.runSync(
        `UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_type = 'customer'`,
        [chatId]
      );
      
      // Reset unread count for this chat
      db.runSync(
        `UPDATE chats SET unread_count = 0 WHERE id = ?`,
        [chatId]
      );
    } catch (error) {
      console.log("Error loading messages:", error);
      Alert.alert("Error", "Gagal memuat pesan");
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) {
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase();
      
      // Insert new message
      db.runSync(
        `INSERT INTO messages (chat_id, sender_id, sender_type, message, created_at, is_read) 
         VALUES (?, ?, 'umkm', ?, datetime('now'), 1)`,
        [chatId, user.id, newMessage.trim()]
      );
      
      // Update chat last message
      db.runSync(
        `UPDATE chats SET 
         last_message = ?, 
         last_message_time = datetime('now')
         WHERE id = ?`,
        [newMessage.trim(), chatId]
      );
      
      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.log("Error sending message:", error);
      Alert.alert("Error", "Gagal mengirim pesan");
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_type === 'umkm';
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTimeJakarta(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{umkmName}</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Icon name="info" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Ketik pesan..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || loading) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || loading}
        >
          <Icon 
            name="send" 
            size={24} 
            color={(!newMessage.trim() || loading) ? "#9ca3af" : "white"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  infoButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 15,
  },
  myMessage: {
    alignItems: "flex-end",
  },
  otherMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: "#48bb78",
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 5,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "#2d3748",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  otherMessageTime: {
    color: "#9ca3af",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#48bb78",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
});

export default ChatDetailScreen;