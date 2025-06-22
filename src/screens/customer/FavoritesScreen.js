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

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadFavorites();
    });
    return unsubscribe;
  }, [navigation]);

  const loadFavorites = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT f.*, u.name, u.image, 
               COUNT(s.id) as service_count,
               AVG(s.rating) as avg_rating,
               MIN(s.price) as min_price,
               GROUP_CONCAT(DISTINCT s.category) as categories
         FROM favorites f
         JOIN users u ON f.umkm_id = u.id
         LEFT JOIN services s ON u.id = s.umkm_id
         WHERE f.customer_id = ?
         GROUP BY f.umkm_id
         ORDER BY f.created_at DESC`,
        [user.id]
      );
      setFavorites(result);
    } catch (error) {
      console.log("Error loading favorites:", error);
      Alert.alert("Error", "Gagal memuat data favorit");
    }
  };

  const removeFavorite = (umkmId) => {
    Alert.alert(
      "Hapus Favorit",
      "Apakah Anda yakin ingin menghapus UMKM ini dari favorit?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync(
                "DELETE FROM favorites WHERE customer_id = ? AND umkm_id = ?",
                [user.id, umkmId]
              );
              loadFavorites();
              Alert.alert("Berhasil", "UMKM berhasil dihapus dari favorit");
            } catch (error) {
              console.log("Error removing favorite:", error);
              Alert.alert("Error", "Gagal menghapus favorit");
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
    setRefreshing(false);
  };

  const handleViewUmkm = (favorite) => {
    const umkm = {
      id: favorite.umkm_id,
      name: favorite.name,
      image: favorite.image,
      service_count: favorite.service_count,
      avg_rating: favorite.avg_rating,
      min_price: favorite.min_price,
      categories: favorite.categories,
    };
    navigation.navigate("UmkmDetail", { umkm });
  };

  const renderFavorite = ({ item }) => (
    <View style={styles.favoriteCard}>
      <TouchableOpacity
        style={styles.favoriteContent}
        onPress={() => handleViewUmkm(item)}
      >
        <View style={styles.favoriteImageContainer}>
          <Image
            source={{ uri: item.image || "https://via.placeholder.com/80" }}
            style={styles.favoriteImage}
          />
        </View>

        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>
              {item.avg_rating ? item.avg_rating.toFixed(1) : "0.0"} (
              {item.service_count || 0} jasa)
            </Text>
          </View>
          <Text style={styles.favoritePrice}>
            Mulai Rp {item.min_price ? item.min_price.toLocaleString() : "0"}
          </Text>
          {item.categories && (
            <Text style={styles.category}>{item.categories.split(",")[0]}</Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFavorite(item.umkm_id)}
      >
        <Icon name="favorite" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="favorite" size={24} color="#f44336" />
            <View>
              <Text style={styles.headerTitle}>UMKM Favorit</Text>
              <Text style={styles.headerSubtitle}>
                Daftar UMKM yang Anda sukai
              </Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="bookmark" size={20} color="white" />
            <Icon name="favorite-border" size={18} color="white" />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            renderItem={renderFavorite}
            keyExtractor={(item) => item.umkm_id.toString()}
            contentContainerStyle={styles.favoritesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="favorite-border" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Favorit</Text>
            <Text style={styles.emptyText}>
              Tambahkan UMKM ke favorit dengan menekan ikon hati pada halaman
              detail UMKM
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
  favoritesList: {
    paddingBottom: 20,
  },
  favoriteCard: {
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
  favoriteContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteImageContainer: {
    marginRight: 15,
  },
  favoriteImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  favoritePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#48bb78",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#48bb78",
    backgroundColor: "#c6f6d5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#c6f6d5",
    alignSelf: "flex-start",
  },
  removeButton: {
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

export default FavoritesScreen;