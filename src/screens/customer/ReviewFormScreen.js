import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";
import { formatDateJakarta } from "../../utils/dateUtils";
import Icon from "react-native-vector-icons/MaterialIcons";

const ReviewFormScreen = ({ route, navigation }) => {
  const { booking } = route.params;
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert("Error", "Mohon berikan rating");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Error", "Mohon berikan komentar");
      return;
    }

    setLoading(true);

    try {
      const db = getDatabase();
      // Insert review
      db.runSync(
        "INSERT INTO reviews (booking_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)",
        [booking.id, user.id, rating, comment.trim()]
      );

      // Update service rating
      updateServiceRating();
    } catch (error) {
      setLoading(false);
      console.log("Review insert error:", error);
      Alert.alert("Error", "Gagal menyimpan review");
    }
  };

  const updateServiceRating = () => {
    try {
      const db = getDatabase();
      // Calculate new average rating for the service
      const result = db.getAllSync(
        `SELECT AVG(r.rating) as avg_rating
         FROM reviews r
         JOIN bookings b ON r.booking_id = b.id
         WHERE b.service_id = ?`,
        [booking.service_id]
      );

      const avgRating = result[0]?.avg_rating || 0;

      // Update service rating
      db.runSync("UPDATE services SET rating = ? WHERE id = ?", [
        avgRating,
        booking.service_id,
      ]);

      setLoading(false);
      Alert.alert("Review Berhasil!", "Terima kasih atas review Anda", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      setLoading(false);
      console.log("Service rating update error:", error);
      Alert.alert("Error", "Gagal mengupdate rating layanan");
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starButton}
        >
          <Icon
            name="star"
            size={30}
            color={i <= rating ? "#ff9800" : "#ddd"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1:
        return "Sangat Buruk";
      case 2:
        return "Buruk";
      case 3:
        return "Cukup";
      case 4:
        return "Baik";
      case 5:
        return "Sangat Baik";
      default:
        return "Pilih Rating";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.bookingInfo}>
        <Text style={styles.serviceName}>{booking.service_name}</Text>
        <Text style={styles.umkmName}>{booking.umkm_name}</Text>
        <Text style={styles.bookingDate}>
          {formatDateJakarta(booking.booking_date, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.reviewForm}>
        <Text style={styles.sectionTitle}>Berikan Review Anda</Text>

        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Rating:</Text>
          <View style={styles.starsContainer}>{renderStars()}</View>
          <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Komentar:</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Bagikan pengalaman Anda dengan layanan ini..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Kirim Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  bookingInfo: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    marginHorizontal: 15,
    marginTop: 15,
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#c6f6d5",
  },
  serviceName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  umkmName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
  },
  reviewForm: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#48bb78",
    marginBottom: 20,
    textAlign: "center",
  },
  ratingSection: {
    marginBottom: 25,
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 16,
    color: "#48bb78",
    marginBottom: 15,
    fontWeight: "600",
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  star: {
    fontSize: 30,
  },
  ratingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  commentSection: {
    marginBottom: 25,
  },
  commentLabel: {
    fontSize: 16,
    color: "#48bb78",
    marginBottom: 10,
    fontWeight: "600",
  },
  commentInput: {
    backgroundColor: "#f8fffe",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E8F5E8",
    fontSize: 16,
    minHeight: 120,
    color: "#48bb78",
  },
  submitButton: {
    backgroundColor: "#48bb78",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ReviewFormScreen;
