import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import getDatabase from '../../database/database';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { user } = useAuth();

  const categories = ['All', 'Laundry', 'Servis AC', 'Pangkas Rambut', 'Les Privat'];

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchText, selectedCategory]);

  const loadServices = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT s.*, u.name as umkm_name 
         FROM services s 
         JOIN users u ON s.umkm_id = u.id 
         WHERE u.role = 'umkm'
         ORDER BY s.rating DESC`
      );
      setServices(result);
    } catch (error) {
      console.log('Error loading services:', error);
      Alert.alert('Error', 'Gagal memuat data jasa');
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    if (searchText) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchText.toLowerCase()) ||
        service.umkm_name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
    setRefreshing(false);
  };

  const handleBookService = (service) => {
    navigation.navigate('BookingForm', { service });
  };

  const renderService = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={() => handleBookService(item)}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>Rp {item.price.toLocaleString()}</Text>
      </View>
      
      <Text style={styles.umkmName}>{item.umkm_name}</Text>
      <Text style={styles.serviceDescription}>{item.description}</Text>
      
      <View style={styles.serviceFooter}>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={16} color="#ff9800" />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === item && styles.categoryTextActive
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.waveEmoji}>👋</Text>
            <View>
              <Text style={styles.headerTitle}>Halo, {user?.name}!</Text>
              <Text style={styles.headerSubtitle}>Cari jasa yang Anda butuhkan</Text>
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
        placeholder="Cari jasa atau UMKM..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {renderCategoryFilter()}

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderService}
        contentContainerStyle={styles.servicesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada jasa ditemukan</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  waveEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  decorativeElements: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  searchInput: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    fontSize: 16,
    elevation: 6,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    elevation: 4,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  categoryButtonActive: {
    backgroundColor: '#48bb78',
    elevation: 6,
    shadowOpacity: 0.25,
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  servicesList: {
    paddingHorizontal: 20,
  },
  serviceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f8f0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
    letterSpacing: 0.5,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#48bb78',
  },
  umkmName: {
    fontSize: 15,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#48bb78',
    backgroundColor: '#f0fff4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
});

export default HomeScreen;