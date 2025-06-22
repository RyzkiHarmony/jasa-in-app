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
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/dateUtils";

const UmkmDetailScreen = ({ route, navigation }) => {
  const { umkm } = route.params;
  const [services, setServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadServices();
  }, []);
  
  useEffect(() => {
    if (user && user.id) {
      checkFavoriteStatus();
    }
  }, [user]);

  const loadServices = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT * FROM services WHERE umkm_id = ? ORDER BY rating DESC`,
        [umkm.id]
      );
      setServices(result);
    } catch (error) {
      console.log("Error loading services:", error);
      Alert.alert("Error", "Gagal memuat data jasa");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
    setRefreshing(false);
  };

  const checkFavoriteStatus = () => {
    if (!user || !user.id) return;
    
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT * FROM favorites WHERE umkm_id = ? AND customer_id = ?`,
        [umkm.id, user.id]
      );
      setIsFavorite(result.length > 0);
    } catch (error) {
      console.log("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = () => {
    if (!user || !user.id) {
      Alert.alert("Error", "Silakan login terlebih dahulu");
      return;
    }
    
    try {
      const db = getDatabase();
      if (isFavorite) {
        // Remove from favorites
        db.runSync(
          `DELETE FROM favorites WHERE umkm_id = ? AND customer_id = ?`,
          [umkm.id, user.id]
        );
        setIsFavorite(false);
        Alert.alert("Sukses", "UMKM dihapus dari favorit");
      } else {
        // Add to favorites
        db.runSync(
          `INSERT INTO favorites (customer_id, umkm_id, created_at) VALUES (?, ?, datetime('now'))`,
          [user.id, umkm.id]
        );
        setIsFavorite(true);
        Alert.alert("Sukses", "UMKM ditambahkan ke favorit");
      }
    } catch (error) {
      console.log("Error toggling favorite:", error);
      Alert.alert("Error", "Gagal mengubah status favorit");
    }
  };

  const startChat = () => {
    if (!user || !user.id) {
      Alert.alert("Error", "Silakan login terlebih dahulu");
      return;
    }
    
    try {
      const db = getDatabase();
      // Check if chat already exists
      const existingChat = db.getAllSync(
        `SELECT * FROM chats WHERE customer_id = ? AND umkm_id = ?`,
        [user.id, umkm.id]
      );
      
      if (existingChat.length > 0) {
        // Navigate to existing chat
        navigation.navigate("ChatDetail", { 
          chatId: existingChat[0].id,
          umkmName: umkm.name 
        });
      } else {
        // Create new chat
        const result = db.runSync(
          `INSERT INTO chats (customer_id, umkm_id, last_message, last_message_time, created_at) 
           VALUES (?, ?, 'Chat dimulai', datetime('now'), datetime('now'))`,
          [user.id, umkm.id]
        );
        
        // Navigate to new chat
        navigation.navigate("ChatDetail", { 
          chatId: result.lastInsertRowId,
          umkmName: umkm.name 
        });
      }
    } catch (error) {
      console.log("Error starting chat:", error);
      Alert.alert("Error", "Gagal memulai chat");
    }
  };

  const handleBookService = (service) => {
    navigation.navigate("BookingForm", { service });
  };

  const renderService = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleBookService(item)}
    >
      <View style={styles.serviceImageContainer}>
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/80" }}
          style={styles.serviceImage}
        />
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription}>{item.description}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>{item.rating} (Rating)</Text>
        </View>
        <Text style={styles.servicePrice}>
          {formatPrice(item.price)}
        </Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => handleBookService(item)}
      >
        <Text style={styles.bookButtonText}>Pesan</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{umkm.name}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleFavorite}
          >
            <Icon 
              name={isFavorite ? "favorite" : "favorite-border"} 
              size={24} 
              color={isFavorite ? "#ff6b6b" : "white"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={startChat}
          >
            <Icon name="chat" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.umkmInfoCard}>
          <View style={styles.umkmImageContainer}>
            <Image
              source={{ uri: umkm.image || "https://via.placeholder.com/100" }}
              style={styles.umkmImage}
            />
          </View>

          <View style={styles.umkmDetails}>
            <Text style={styles.umkmName}>{umkm.name}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={20} color="#fbbf24" />
              <Text style={styles.ratingText}>
                {umkm.avg_rating ? umkm.avg_rating.toFixed(1) : "0.0"}(
                {umkm.service_count || 0} jasa)
              </Text>
            </View>

            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Icon name="phone" size={16} color="#6b7280" />
                <Text style={styles.contactText}>{umkm.phone}</Text>
              </View>
              <View style={styles.contactItem}>
                <Icon name="email" size={16} color="#6b7280" />
                <Text style={styles.contactText}>{umkm.email}</Text>
              </View>
              <View style={styles.contactItem}>
                <Icon name="location-on" size={16} color="#6b7280" />
                <Text style={styles.contactText}>2.5 km dari lokasi Anda</Text>
              </View>
            </View>

            {umkm.categories && (
              <View style={styles.categoriesContainer}>
                {umkm.categories.split(",").map((category, index) => (
                  <Text key={index} style={styles.categoryTag}>
                    {category.trim()}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.servicesSectionTitle}>Jasa yang Tersedia</Text>

          {services.length > 0 ? (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderService}
              scrollEnabled={false}
              contentContainerStyle={styles.servicesList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="work-off" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Belum ada jasa yang tersedia</Text>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 15,
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  umkmInfoCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  umkmImageContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  umkmImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f3f4f6",
  },
  umkmDetails: {
    alignItems: "center",
  },
  umkmName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 10,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 5,
  },
  contactInfo: {
    width: "100%",
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "center",
  },
  contactText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  categoryTag: {
    fontSize: 12,
    color: "#48bb78",
    backgroundColor: "#c6f6d5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    margin: 4,
    borderWidth: 1,
    borderColor: "#c6f6d5",
  },
  servicesSection: {
    marginBottom: 20,
  },
  servicesSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 15,
  },
  servicesList: {
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: "white",
    marginBottom: 15,
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
  serviceImageContainer: {
    marginRight: 15,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#48bb78",
    marginBottom: 4,
  },
  category: {
    fontSize: 10,
    color: "#48bb78",
    backgroundColor: "#c6f6d5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#c6f6d5",
  },
  bookButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 10,
  },
});

export default UmkmDetailScreen;
