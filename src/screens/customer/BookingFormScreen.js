import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import getDatabase from '../../database/database';
import { useAuth } from '../../context/AuthContext';
import {
  getCurrentJakartaTime,
  formatDateJakarta,
  formatTimeJakarta,
  formatDateTimeJakarta,
  isValidBookingDate,
  toDBFormat,
  getMinimumDate,
  formatPrice
} from '../../utils/dateUtils';

const BookingFormScreen = ({ route, navigation }) => {
  const { service } = route.params;
  const { user } = useAuth();
  const [bookingDate, setBookingDate] = useState(getCurrentJakartaTime());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBookingDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(bookingDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setBookingDate(newDate);
    }
  };

  const handleBooking = () => {
    if (!isValidBookingDate(bookingDate)) {
      Alert.alert('Error', 'Tanggal booking tidak boleh di masa lalu');
      return;
    }

    Alert.alert(
      'Konfirmasi Booking',
      `Apakah Anda yakin ingin booking ${service.name} pada ${formatDateTimeJakarta(bookingDate)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya', onPress: confirmBooking }
      ]
    );
  };

  const confirmBooking = () => {
    setLoading(true);
    
    try {
      const db = getDatabase();
      const result = db.runSync(
        'INSERT INTO bookings (customer_id, service_id, booking_date, status, total_price) VALUES (?, ?, ?, ?, ?)',
        [user.id, service.id, toDBFormat(bookingDate), 'pending', service.price]
      );
      
      setLoading(false);
      Alert.alert(
        'Booking Berhasil!',
        'Booking Anda telah dikirim. Silakan tunggu konfirmasi dari UMKM.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      console.log('Booking error:', error);
      Alert.alert('Error', 'Gagal membuat booking');
    }
  };

  const formatDate = (date) => {
    return formatDateJakarta(date, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return formatTimeJakarta(date, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.umkmName}>{service.umkm_name}</Text>
        <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Detail Booking</Text>
        
        <View style={styles.dateTimeContainer}>
          <Text style={styles.label}>Tanggal:</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateTimeText}>{formatDate(bookingDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.label}>Waktu:</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateTimeText}>{formatTime(bookingDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Catatan (Opsional):</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Tambahkan catatan khusus untuk UMKM..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Ringkasan Booking</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Layanan:</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tanggal & Waktu:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(bookingDate)} {formatTime(bookingDate)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Harga:</Text>
            <Text style={styles.summaryPrice}>{formatPrice(service.price)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.bookButtonText}>Konfirmasi Booking</Text>
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={bookingDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={getMinimumDate()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={bookingDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fcff',
  },
  serviceInfo: {
    backgroundColor: 'white',
    padding: 28,
    marginBottom: 18,
    borderRadius: 25,
    marginHorizontal: 18,
    marginTop: 18,
    elevation: 8,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  serviceName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  umkmName: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#48bb78',
    marginBottom: 12,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'white',
    padding: 28,
    borderRadius: 25,
    marginHorizontal: 18,
    marginBottom: 18,
    elevation: 8,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 25,
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 10,
    fontWeight: '600',
  },
  dateTimeButton: {
    backgroundColor: '#f8fcff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#c6f6d5',
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 25,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    padding: 18,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    fontSize: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summary: {
    backgroundColor: '#f0fff4',
    padding: 24,
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#c6f6d5',
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48bb78',
    flex: 2,
    textAlign: 'right',
  },
  bookButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingFormScreen;