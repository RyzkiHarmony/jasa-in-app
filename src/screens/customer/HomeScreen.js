import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/dateUtils";

const HomeScreen = ({ navigation }) => {
  const [umkms, setUmkms] = useState([]);
  const [filteredUmkms, setFilteredUmkms] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user } = useAuth();

  const categories = [
    { name: "All", icon: "apps", label: "Semua" },
    { name: "Laundry", icon: "local-laundry-service", label: "Laundry" },
    { name: "Servis", icon: "build", label: "Servis" },
    { name: "Barbershop", icon: "content-cut", label: "Barbershop" },
    { name: "Les Privat", icon: "school", label: "Les Privat" },
    { name: "Fotografi", icon: "camera-alt", label: "Fotografi" },
    { name: "Montir", icon: "motorcycle", label: "Montir" },
  ];

  useEffect(() => {
    loadUmkms();
  }, []);

  useEffect(() => {
    filterUmkms();
  }, [umkms, searchText, selectedCategory]);

  const loadUmkms = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT u.*, 
               COUNT(s.id) as service_count,
               AVG(s.rating) as avg_rating,
               MIN(s.price) as min_price,
               GROUP_CONCAT(DISTINCT s.category) as categories
         FROM users u 
         LEFT JOIN services s ON u.id = s.umkm_id 
         WHERE u.role = 'umkm'
         GROUP BY u.id
         ORDER BY avg_rating DESC`
      );
      setUmkms(result);
    } catch (error) {
      console.log("Error loading UMKMs:", error);
      Alert.alert("Error", "Gagal memuat data UMKM");
    }
  };

  const filterUmkms = () => {
    let filtered = umkms;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((umkm) => {
        // Map category names to match service categories
        const categoryMap = {
          Laundry: "Laundry",
          Servis: "Servis AC",
          Barbershop: "Pangkas Rambut",
          "Les Privat": "Les Privat",
          Fotografi: "Fotografi",
          Montir: "Montir",
        };
        const targetCategory =
          categoryMap[selectedCategory] || selectedCategory;
        return umkm.categories && umkm.categories.includes(targetCategory);
      });
    }

    if (searchText) {
      filtered = filtered.filter(
        (umkm) =>
          umkm.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (umkm.categories &&
            umkm.categories.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredUmkms(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUmkms();
    setRefreshing(false);
  };

  const handleViewUmkm = (umkm) => {
    navigation.navigate("UmkmDetail", { umkm });
  };

  const renderUmkm = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleViewUmkm(item)}
    >
      <View style={styles.serviceImageContainer}>
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/80" }}
          style={styles.serviceImage}
        />
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>
            {item.avg_rating ? item.avg_rating.toFixed(1) : "0.0"} (
            {item.service_count || 0} jasa)
          </Text>
        </View>
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={14} color="#6b7280" />
          <Text style={styles.locationText}>{item.distance || "2.5"} km</Text>
        </View>
        <Text style={styles.servicePrice}>
          Mulai {formatPrice(item.min_price || 0)}
        </Text>
        {item.categories && (
          <Text style={styles.category}>{item.categories.split(",")[0]}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => handleViewUmkm(item)}
      >
        <Text style={styles.bookButtonText}>Lihat</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCategoryGrid = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>Kategori Populer</Text>
      <View style={styles.categoryGrid}>
        {categories.slice(1).map((category, index) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryGridItem,
              selectedCategory === category.name &&
                styles.categoryGridItemActive,
            ]}
            onPress={() => setSelectedCategory(category.name)}
          >
            <View style={styles.categoryIconContainer}>
              <Icon
                name={category.icon}
                size={32}
                color={
                  selectedCategory === category.name ? "#48bb78" : "#6b7280"
                }
              />
            </View>
            <Text
              style={[
                styles.categoryGridText,
                selectedCategory === category.name &&
                  styles.categoryGridTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="pan-tool" size={24} color="#fbbf24" />
            <View>
              <Text style={styles.headerTitle}>Halo, {user?.name}!</Text>
              <Text style={styles.headerSubtitle}>
                Temukan UMKM terpercaya di sekitar Anda
              </Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="build" size={24} color="#48bb78" />
            <Icon name="favorite-border" size={24} color="#48bb78" />
          </View>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Cari UMKM atau kategori jasa..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {renderCategoryGrid()}

      <View style={styles.servicesSection}>
        <View style={styles.servicesSectionHeader}>
          <Text style={styles.servicesSectionTitle}>UMKM Terdekat</Text>
          <TouchableOpacity onPress={() => console.log("Lihat Semua pressed")}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredUmkms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUmkm}
          contentContainerStyle={styles.servicesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada UMKM ditemukan</Text>
            </View>
          }
        />
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
  },
  serviceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  heartIcon: {
    fontSize: 18,
  },
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
  searchInput: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    fontSize: 16,
    elevation: 6,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#e8f5e8",
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 15,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryGridItem: {
    width: "30%",
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  categoryGridItemActive: {
    borderColor: "#48bb78",
    borderWidth: 2,
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryGridText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryGridTextActive: {
    color: "#48bb78",
    fontWeight: "bold",
  },
  servicesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  servicesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  servicesSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
  },
  seeAllText: {
    fontSize: 14,
    color: "#48bb78",
    fontWeight: "600",
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 2,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#48bb78",
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
});

export default HomeScreen;
