import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";

const AdvancedSearchScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [rating, setRating] = useState("All");
  const [distance, setDistance] = useState("All");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  const categories = [
    { name: "All", label: "Semua Kategori" },
    { name: "Laundry", label: "Laundry" },
    { name: "Servis AC", label: "Servis AC" },
    { name: "Pangkas Rambut", label: "Barbershop" },
    { name: "Les Privat", label: "Les Privat" },
    { name: "Fotografi", label: "Fotografi" },
    { name: "Montir", label: "Montir" },
  ];

  const priceRanges = [
    { name: "All", label: "Semua Harga" },
    { name: "0-50000", label: "< Rp 50.000" },
    { name: "50000-100000", label: "Rp 50.000 - 100.000" },
    { name: "100000-200000", label: "Rp 100.000 - 200.000" },
    { name: "200000+", label: "> Rp 200.000" },
  ];

  const ratings = [
    { name: "All", label: "Semua Rating" },
    { name: "4+", label: "4+ Bintang" },
    { name: "3+", label: "3+ Bintang" },
    { name: "2+", label: "2+ Bintang" },
  ];

  const distances = [
    { name: "All", label: "Semua Jarak" },
    { name: "1", label: "< 1 km" },
    { name: "5", label: "< 5 km" },
    { name: "10", label: "< 10 km" },
  ];

  const performSearch = () => {
    setIsSearching(true);
    try {
      const db = getDatabase();
      let query = `
        SELECT u.*, 
               COUNT(s.id) as service_count,
               AVG(s.rating) as avg_rating,
               MIN(s.price) as min_price,
               GROUP_CONCAT(DISTINCT s.category) as categories
        FROM users u 
        LEFT JOIN services s ON u.id = s.umkm_id 
        WHERE u.role = 'umkm'
      `;
      
      const params = [];
      
      // Filter by search text
      if (searchText.trim()) {
        query += ` AND (u.name LIKE ? OR s.category LIKE ? OR s.name LIKE ?)`;
        const searchParam = `%${searchText.trim()}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      // Filter by category
      if (selectedCategory !== "All") {
        query += ` AND s.category = ?`;
        params.push(selectedCategory);
      }
      
      query += ` GROUP BY u.id`;
      
      // Filter by rating
      if (rating !== "All") {
        const minRating = parseFloat(rating.replace("+", ""));
        query += ` HAVING avg_rating >= ?`;
        params.push(minRating);
      }
      
      // Filter by price range
      if (priceRange !== "All") {
        if (priceRange === "200000+") {
          query += ` AND min_price >= 200000`;
        } else {
          const [min, max] = priceRange.split("-").map(Number);
          if (max) {
            query += ` AND min_price BETWEEN ? AND ?`;
            params.push(min, max);
          } else {
            query += ` AND min_price < ?`;
            params.push(min);
          }
        }
      }
      
      query += ` ORDER BY avg_rating DESC`;
      
      const result = db.getAllSync(query, params);
      setResults(result);
    } catch (error) {
      console.log("Error performing search:", error);
      Alert.alert("Error", "Gagal melakukan pencarian");
    } finally {
      setIsSearching(false);
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedCategory("All");
    setPriceRange("All");
    setRating("All");
    setDistance("All");
    setResults([]);
  };

  const handleViewUmkm = (umkm) => {
    navigation.navigate("UmkmDetail", { umkm });
  };

  const renderFilterSection = (title, options, selected, onSelect) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.name}
              style={[
                styles.filterOption,
                selected === option.name && styles.filterOptionActive,
              ]}
              onPress={() => onSelect(option.name)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selected === option.name && styles.filterOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleViewUmkm(item)}
    >
      <View style={styles.resultImageContainer}>
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/80" }}
          style={styles.resultImage}
        />
      </View>

      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>
            {item.avg_rating ? item.avg_rating.toFixed(1) : "0.0"} (
            {item.service_count || 0} jasa)
          </Text>
        </View>
        <Text style={styles.resultPrice}>
          Mulai Rp {item.min_price ? item.min_price.toLocaleString() : "0"}
        </Text>
        {item.categories && (
          <Text style={styles.category}>{item.categories.split(",")[0]}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewUmkm(item)}
      >
        <Text style={styles.viewButtonText}>Lihat</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Pencarian Lanjutan</Text>
            <Text style={styles.headerSubtitle}>Filter dan cari UMKM</Text>
          </View>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Input */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari UMKM, layanan, atau kategori..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Filters */}
        {renderFilterSection(
          "Kategori",
          categories,
          selectedCategory,
          setSelectedCategory
        )}
        {renderFilterSection(
          "Rentang Harga",
          priceRanges,
          priceRange,
          setPriceRange
        )}
        {renderFilterSection("Rating", ratings, rating, setRating)}
        {renderFilterSection("Jarak", distances, distance, setDistance)}

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={performSearch}
          disabled={isSearching}
        >
          <Icon name="search" size={20} color="white" />
          <Text style={styles.searchButtonText}>
            {isSearching ? "Mencari..." : "Cari UMKM"}
          </Text>
        </TouchableOpacity>

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              Ditemukan {results.length} UMKM
            </Text>
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {results.length === 0 && isSearching === false && searchText && (
          <View style={styles.noResultsContainer}>
            <Icon name="search-off" size={60} color="#e2e8f0" />
            <Text style={styles.noResultsText}>
              Tidak ada UMKM yang sesuai dengan kriteria pencarian
            </Text>
          </View>
        )}
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
  resetButton: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 10,
    fontSize: 16,
    color: "#2d3748",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: "row",
    gap: 10,
  },
  filterOption: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterOptionActive: {
    backgroundColor: "#48bb78",
    borderColor: "#48bb78",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterOptionTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  searchButton: {
    backgroundColor: "#48bb78",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 20,
    gap: 10,
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 15,
  },
  resultCard: {
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
  resultImageContainer: {
    marginRight: 15,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  resultInfo: {
    flex: 1,
    marginRight: 10,
  },
  resultName: {
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
  resultPrice: {
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
  viewButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viewButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 24,
  },
});

export default AdvancedSearchScreen;