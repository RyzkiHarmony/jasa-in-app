import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

const MapScreen = ({ navigation, route }) => {
  const [umkms, setUmkms] = useState([]);
  const [selectedUmkm, setSelectedUmkm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { user } = useAuth();
  const { initialUmkmId } = route.params || {};

  const categories = [
    { value: "all", label: "Semua", icon: "apps", color: "#6b7280" },
    { value: "teknologi", label: "Teknologi", icon: "computer", color: "#3b82f6" },
    { value: "makanan", label: "Makanan", icon: "restaurant", color: "#f59e0b" },
    { value: "fashion", label: "Fashion", icon: "checkroom", color: "#ec4899" },
    { value: "kesehatan", label: "Kesehatan", icon: "local-hospital", color: "#10b981" },
    { value: "pendidikan", label: "Pendidikan", icon: "school", color: "#8b5cf6" },
    { value: "otomotif", label: "Otomotif", icon: "directions-car", color: "#ef4444" },
    { value: "rumah_tangga", label: "Rumah Tangga", icon: "home", color: "#06b6d4" },
    { value: "kecantikan", label: "Kecantikan", icon: "face", color: "#f97316" },
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUmkms();
      getCurrentLocation();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (initialUmkmId) {
      const umkm = umkms.find(u => u.id === initialUmkmId);
      if (umkm) {
        setSelectedUmkm(umkm);
        setModalVisible(true);
        // Center map on selected UMKM
        if (umkm.latitude && umkm.longitude) {
          setMapRegion({
            latitude: parseFloat(umkm.latitude),
            longitude: parseFloat(umkm.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    }
  }, [initialUmkmId, umkms]);

  const loadUmkms = () => {
    try {
      const db = getDatabase();
      let query = `
        SELECT u.*, 
               COUNT(DISTINCT s.id) as service_count,
               AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating ELSE 0 END) as avg_rating,
               COUNT(DISTINCT r.id) as review_count,
               MIN(s.price) as min_price
        FROM users u
        LEFT JOIN services s ON u.id = s.umkm_id
        LEFT JOIN reviews r ON s.id = r.service_id
        WHERE u.role = 'umkm' AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
      `;
      
      let params = [];
      
      if (selectedCategory !== "all") {
        query += " AND u.category = ?";
        params.push(selectedCategory);
      }
      
      query += " GROUP BY u.id ORDER BY u.business_name";
      
      const result = db.getAllSync(query, params);
      
      // Filter by search query if provided
      const filteredResult = searchQuery
        ? result.filter(umkm => 
            umkm.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            umkm.address.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : result;
      
      setUmkms(filteredResult);
    } catch (error) {
      console.log("Error loading UMKMs:", error);
      Alert.alert("Error", "Gagal memuat data UMKM");
    }
  };

  const getCurrentLocation = () => {
    // Simulate getting current location
    // In real app, use react-native-geolocation-service
    const mockLocation = {
      latitude: -6.2088,
      longitude: 106.8456,
    };
    setUserLocation(mockLocation);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const getDistanceText = (umkm) => {
    if (!userLocation || !umkm.latitude || !umkm.longitude) {
      return "Jarak tidak diketahui";
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      parseFloat(umkm.latitude),
      parseFloat(umkm.longitude)
    );
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  const openDirections = (umkm) => {
    if (!umkm.latitude || !umkm.longitude) {
      Alert.alert("Error", "Lokasi UMKM tidak tersedia");
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${umkm.latitude},${umkm.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Tidak dapat membuka aplikasi maps");
    });
  };

  const formatPrice = (price) => {
    return `Rp ${price?.toLocaleString() || 0}`;
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const renderMapView = () => {
    // Simplified map view - in real app, use react-native-maps
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={60} color="#e2e8f0" />
          <Text style={styles.mapPlaceholderText}>Peta Interaktif</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Menampilkan {umkms.length} UMKM di sekitar Anda
          </Text>
        </View>
        
        {/* Map Markers Simulation */}
        <View style={styles.markersContainer}>
          {umkms.slice(0, 5).map((umkm, index) => (
            <TouchableOpacity
              key={umkm.id}
              style={[
                styles.mapMarker,
                {
                  left: 50 + (index * 60),
                  top: 100 + (index * 40),
                }
              ]}
              onPress={() => {
                setSelectedUmkm(umkm);
                setModalVisible(true);
              }}
            >
              <View style={[
                styles.markerPin,
                { backgroundColor: getCategoryInfo(umkm.category).color }
              ]}>
                <Icon 
                  name={getCategoryInfo(umkm.category).icon} 
                  size={16} 
                  color="white" 
                />
              </View>
              <Text style={styles.markerText} numberOfLines={1}>
                {umkm.business_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* User Location Marker */}
        {userLocation && (
          <View style={styles.userLocationMarker}>
            <View style={styles.userLocationPin}>
              <Icon name="my-location" size={16} color="white" />
            </View>
            <Text style={styles.userLocationText}>Lokasi Anda</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari UMKM atau alamat..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Debounce search
              setTimeout(() => loadUmkms(), 300);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                loadUmkms();
              }}
            >
              <Icon name="clear" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {/* Open filter modal */}}
        >
          <Icon name="tune" size={20} color="#10b981" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategoryTabs = () => {
    return (
      <View style={styles.categoryTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: selectedCategory === category.value 
                    ? category.color 
                    : "white",
                  borderColor: category.color,
                }
              ]}
              onPress={() => {
                setSelectedCategory(category.value);
                loadUmkms();
              }}
            >
              <Icon 
                name={category.icon} 
                size={16} 
                color={selectedCategory === category.value ? "white" : category.color} 
              />
              <Text style={[
                styles.categoryTabText,
                {
                  color: selectedCategory === category.value ? "white" : category.color
                }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderUmkmList = () => {
    return (
      <View style={styles.umkmListContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>UMKM Terdekat</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AdvancedSearch")}
          >
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.umkmList}
        >
          {umkms.slice(0, 10).map((umkm) => (
            <TouchableOpacity
              key={umkm.id}
              style={styles.umkmCard}
              onPress={() => {
                setSelectedUmkm(umkm);
                setModalVisible(true);
              }}
            >
              <View style={styles.umkmImageContainer}>
                <Image
                  source={{ uri: umkm.profile_image || "https://via.placeholder.com/100" }}
                  style={styles.umkmImage}
                />
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryInfo(umkm.category).color }
                ]}>
                  <Icon 
                    name={getCategoryInfo(umkm.category).icon} 
                    size={12} 
                    color="white" 
                  />
                </View>
              </View>
              
              <View style={styles.umkmInfo}>
                <Text style={styles.umkmName} numberOfLines={1}>
                  {umkm.business_name}
                </Text>
                
                <View style={styles.umkmMeta}>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={12} color="#fbbf24" />
                    <Text style={styles.ratingText}>
                      {umkm.avg_rating ? umkm.avg_rating.toFixed(1) : "0.0"}
                    </Text>
                  </View>
                  
                  <View style={styles.distanceContainer}>
                    <Icon name="location-on" size={12} color="#6b7280" />
                    <Text style={styles.distanceText}>
                      {getDistanceText(umkm)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.serviceCount}>
                  {umkm.service_count} layanan
                </Text>
                
                {umkm.min_price && (
                  <Text style={styles.priceText}>
                    Mulai {formatPrice(umkm.min_price)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderUmkmModal = () => {
    if (!selectedUmkm) return null;
    
    return (
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
            <Text style={styles.modalTitle}>Detail UMKM</Text>
            <TouchableOpacity onPress={() => openDirections(selectedUmkm)}>
              <Icon name="directions" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.umkmHeader}>
              <Image
                source={{ uri: selectedUmkm.profile_image || "https://via.placeholder.com/100" }}
                style={styles.umkmModalImage}
              />
              
              <View style={styles.umkmHeaderInfo}>
                <Text style={styles.umkmModalName}>
                  {selectedUmkm.business_name}
                </Text>
                
                <View style={styles.umkmModalMeta}>
                  <View style={styles.modalRatingContainer}>
                    <Icon name="star" size={16} color="#fbbf24" />
                    <Text style={styles.modalRatingText}>
                      {selectedUmkm.avg_rating ? selectedUmkm.avg_rating.toFixed(1) : "0.0"}
                    </Text>
                    <Text style={styles.modalReviewCount}>
                      ({selectedUmkm.review_count} ulasan)
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.modalCategoryBadge,
                    { backgroundColor: getCategoryInfo(selectedUmkm.category).color }
                  ]}>
                    <Icon 
                      name={getCategoryInfo(selectedUmkm.category).icon} 
                      size={14} 
                      color="white" 
                    />
                    <Text style={styles.modalCategoryText}>
                      {getCategoryInfo(selectedUmkm.category).label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.umkmDetails}>
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Icon name="location-on" size={20} color="#6b7280" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Alamat</Text>
                    <Text style={styles.detailValue}>{selectedUmkm.address}</Text>
                    <Text style={styles.distanceInfo}>
                      {getDistanceText(selectedUmkm)} dari lokasi Anda
                    </Text>
                  </View>
                </View>
                
                {selectedUmkm.phone && (
                  <View style={styles.detailRow}>
                    <Icon name="phone" size={20} color="#6b7280" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Telepon</Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedUmkm.phone}`)}
                      >
                        <Text style={styles.detailValueLink}>{selectedUmkm.phone}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {selectedUmkm.email && (
                  <View style={styles.detailRow}>
                    <Icon name="email" size={20} color="#6b7280" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`mailto:${selectedUmkm.email}`)}
                      >
                        <Text style={styles.detailValueLink}>{selectedUmkm.email}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Icon name="business" size={20} color="#6b7280" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Layanan</Text>
                    <Text style={styles.detailValue}>
                      {selectedUmkm.service_count} layanan tersedia
                    </Text>
                    {selectedUmkm.min_price && (
                      <Text style={styles.priceInfo}>
                        Mulai dari {formatPrice(selectedUmkm.min_price)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              
              {selectedUmkm.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Deskripsi</Text>
                  <Text style={styles.descriptionText}>
                    {selectedUmkm.description}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => openDirections(selectedUmkm)}
              >
                <Icon name="directions" size={20} color="white" />
                <Text style={styles.directionsButtonText}>Petunjuk Arah</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.viewServicesButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate("UmkmDetail", { umkmId: selectedUmkm.id });
                }}
              >
                <Icon name="visibility" size={20} color="#10b981" />
                <Text style={styles.viewServicesButtonText}>Lihat Layanan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
            <Text style={styles.headerTitle}>Peta UMKM</Text>
            <Text style={styles.headerSubtitle}>
              Temukan UMKM terdekat di sekitar Anda
            </Text>
          </View>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
          >
            <Icon name="my-location" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {renderSearchBar()}
        {renderCategoryTabs()}
        {renderMapView()}
        {renderUmkmList()}
      </View>

      {renderUmkmModal()}
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
  locationButton: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2d3748",
  },
  filterButton: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryTabs: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mapContainer: {
    height: height * 0.4,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#f7fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a5568",
    marginTop: 10,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5,
  },
  markersContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapMarker: {
    position: "absolute",
    alignItems: "center",
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerText: {
    fontSize: 10,
    color: "#2d3748",
    fontWeight: "600",
    marginTop: 2,
    maxWidth: 80,
    textAlign: "center",
  },
  userLocationMarker: {
    position: "absolute",
    top: 50,
    left: 50,
    alignItems: "center",
  },
  userLocationPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  userLocationText: {
    fontSize: 10,
    color: "#3b82f6",
    fontWeight: "600",
    marginTop: 2,
  },
  umkmListContainer: {
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
  },
  seeAllText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  umkmList: {
    paddingRight: 20,
  },
  umkmCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  umkmImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  umkmImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    backgroundColor: "#f7fafc",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 4,
  },
  umkmInfo: {
    flex: 1,
  },
  umkmName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  umkmMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: "#4a5568",
    fontWeight: "600",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  distanceText: {
    fontSize: 12,
    color: "#6b7280",
  },
  serviceCount: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  priceText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "bold",
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  umkmHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  umkmModalImage: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: "#f7fafc",
    marginRight: 15,
  },
  umkmHeaderInfo: {
    flex: 1,
    justifyContent: "center",
  },
  umkmModalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 8,
  },
  umkmModalMeta: {
    gap: 8,
  },
  modalRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modalRatingText: {
    fontSize: 14,
    color: "#4a5568",
    fontWeight: "600",
  },
  modalReviewCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  modalCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  modalCategoryText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  umkmDetails: {
    marginBottom: 20,
  },
  detailSection: {
    gap: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#2d3748",
    lineHeight: 20,
  },
  detailValueLink: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  distanceInfo: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  priceInfo: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
    marginTop: 2,
  },
  descriptionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  directionsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  directionsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  viewServicesButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  viewServicesButtonText: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MapScreen;