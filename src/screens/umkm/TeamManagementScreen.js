import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import getDatabase from "../../database/database";
import { useAuth } from "../../context/AuthContext";

const TeamManagementScreen = ({ navigation }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "staff",
    specialization: "",
    salary: "",
    join_date: "",
    status: "active",
  });
  const { user } = useAuth();

  const roles = [
    { value: "manager", label: "Manager", color: "#9f7aea" },
    { value: "staff", label: "Staff", color: "#4299e1" },
    { value: "technician", label: "Teknisi", color: "#48bb78" },
    { value: "admin", label: "Admin", color: "#f6ad55" },
  ];

  const statuses = [
    { value: "active", label: "Aktif", color: "#48bb78" },
    { value: "inactive", label: "Tidak Aktif", color: "#f56565" },
    { value: "on_leave", label: "Cuti", color: "#f6ad55" },
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTeamMembers();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTeamMembers = () => {
    try {
      const db = getDatabase();
      const result = db.getAllSync(
        `SELECT tm.*, COUNT(b.id) as total_bookings,
         AVG(r.rating) as avg_rating
         FROM team_members tm
         LEFT JOIN bookings b ON tm.id = b.assigned_to AND b.status = 'completed'
         LEFT JOIN reviews r ON b.id = r.booking_id
         WHERE tm.umkm_id = ?
         GROUP BY tm.id
         ORDER BY tm.created_at DESC`,
        [user.id]
      );
      setTeamMembers(result);
    } catch (error) {
      console.log("Error loading team members:", error);
      Alert.alert("Error", "Gagal memuat data tim");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamMembers();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "staff",
      specialization: "",
      salary: "",
      join_date: new Date().toISOString().split('T')[0],
      status: "active",
    });
    setModalVisible(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
      specialization: member.specialization || "",
      salary: member.salary?.toString() || "",
      join_date: member.join_date?.split('T')[0] || "",
      status: member.status,
    });
    setModalVisible(true);
  };

  const saveMember = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Nama harus diisi");
      return;
    }

    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      if (editingMember) {
        // Update existing member
        db.runSync(
          `UPDATE team_members SET 
           name = ?, email = ?, phone = ?, role = ?, specialization = ?,
           salary = ?, join_date = ?, status = ?, updated_at = ?
           WHERE id = ?`,
          [
            formData.name,
            formData.email || null,
            formData.phone || null,
            formData.role,
            formData.specialization || null,
            formData.salary ? parseFloat(formData.salary) : null,
            formData.join_date || null,
            formData.status,
            now,
            editingMember.id,
          ]
        );
        Alert.alert("Berhasil", "Data anggota tim berhasil diperbarui");
      } else {
        // Create new member
        db.runSync(
          `INSERT INTO team_members 
           (umkm_id, name, email, phone, role, specialization, salary, join_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            formData.name,
            formData.email || null,
            formData.phone || null,
            formData.role,
            formData.specialization || null,
            formData.salary ? parseFloat(formData.salary) : null,
            formData.join_date || null,
            formData.status,
            now,
          ]
        );
        Alert.alert("Berhasil", "Anggota tim berhasil ditambahkan");
      }

      setModalVisible(false);
      loadTeamMembers();
    } catch (error) {
      console.log("Error saving member:", error);
      Alert.alert("Error", "Gagal menyimpan data anggota tim");
    }
  };

  const updateMemberStatus = (member, newStatus) => {
    const statusInfo = statuses.find(s => s.value === newStatus);
    Alert.alert(
      "Ubah Status",
      `Apakah Anda yakin ingin mengubah status ${member.name} menjadi ${statusInfo.label}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ubah",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync(
                "UPDATE team_members SET status = ?, updated_at = ? WHERE id = ?",
                [newStatus, new Date().toISOString(), member.id]
              );
              loadTeamMembers();
              Alert.alert("Berhasil", `Status ${member.name} berhasil diubah`);
            } catch (error) {
              console.log("Error updating status:", error);
              Alert.alert("Error", "Gagal mengubah status");
            }
          },
        },
      ]
    );
  };

  const deleteMember = (memberId, memberName) => {
    Alert.alert(
      "Hapus Anggota Tim",
      `Apakah Anda yakin ingin menghapus ${memberName} dari tim?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            try {
              const db = getDatabase();
              db.runSync("DELETE FROM team_members WHERE id = ?", [memberId]);
              loadTeamMembers();
              Alert.alert("Berhasil", "Anggota tim berhasil dihapus");
            } catch (error) {
              console.log("Error deleting member:", error);
              Alert.alert("Error", "Gagal menghapus anggota tim");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Tidak diketahui";
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const formatSalary = (salary) => {
    if (!salary) return "Tidak diset";
    return `Rp ${salary.toLocaleString()}`;
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[1];
  };

  const getStatusInfo = (status) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderMember = ({ item }) => {
    const roleInfo = getRoleInfo(item.role);
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberInfo}>
            <View style={[styles.avatar, { backgroundColor: roleInfo.color }]}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>{item.name}</Text>
              <View style={styles.memberBadges}>
                <View style={[styles.roleBadge, { backgroundColor: roleInfo.color }]}>
                  <Text style={styles.badgeText}>{roleInfo.label}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Text style={styles.badgeText}>{statusInfo.label}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.memberActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Icon name="edit" size={20} color="#4299e1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteMember(item.id, item.name)}
            >
              <Icon name="delete" size={20} color="#f56565" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <Icon name="work" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {item.specialization || "Tidak ada spesialisasi"}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="phone" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {item.phone || "Tidak ada nomor"}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="email" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {item.email || "Tidak ada email"}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="event" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              Bergabung: {formatDate(item.join_date)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="attach-money" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              Gaji: {formatSalary(item.salary)}
            </Text>
          </View>
        </View>
        
        <View style={styles.performanceStats}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceNumber}>{item.total_bookings || 0}</Text>
            <Text style={styles.performanceLabel}>Total Booking</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceNumber}>
              {item.avg_rating ? item.avg_rating.toFixed(1) : "0.0"}
            </Text>
            <Text style={styles.performanceLabel}>Rating Rata-rata</Text>
          </View>
        </View>
        
        <View style={styles.statusActions}>
          <Text style={styles.statusActionsLabel}>Ubah Status:</Text>
          <View style={styles.statusButtons}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusButton,
                  { backgroundColor: status.color },
                  item.status === status.value && styles.statusButtonActive
                ]}
                onPress={() => updateMemberStatus(item, status.value)}
                disabled={item.status === status.value}
              >
                <Text style={[
                  styles.statusButtonText,
                  item.status === status.value && styles.statusButtonTextActive
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
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
            <Text style={styles.headerTitle}>Manajemen Tim</Text>
            <Text style={styles.headerSubtitle}>Kelola anggota tim Anda</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Icon name="person-add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>Total Anggota</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {teamMembers.filter(m => m.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {teamMembers.filter(m => m.status === 'on_leave').length}
            </Text>
            <Text style={styles.statLabel}>Cuti</Text>
          </View>
        </View>

        {teamMembers.length > 0 ? (
          <FlatList
            data={teamMembers}
            renderItem={renderMember}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.membersList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="people" size={80} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Anggota Tim</Text>
            <Text style={styles.emptyText}>
              Tambahkan anggota tim untuk membantu mengelola bisnis Anda
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
              <Text style={styles.createButtonText}>Tambah Anggota</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Create/Edit Modal */}
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
            <Text style={styles.modalTitle}>
              {editingMember ? "Edit Anggota Tim" : "Tambah Anggota Tim"}
            </Text>
            <TouchableOpacity onPress={saveMember}>
              <Text style={styles.saveButton}>Simpan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Lengkap *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Masukkan nama lengkap"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@example.com"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor Telepon</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Posisi/Role</Text>
              <View style={styles.roleSelector}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      { borderColor: role.color },
                      formData.role === role.value && { backgroundColor: role.color }
                    ]}
                    onPress={() => setFormData({ ...formData, role: role.value })}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      { color: formData.role === role.value ? "white" : role.color }
                    ]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Spesialisasi</Text>
              <TextInput
                style={styles.input}
                value={formData.specialization}
                onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                placeholder="Contoh: Teknisi AC, Desain Grafis"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gaji (Rp)</Text>
              <TextInput
                style={styles.input}
                value={formData.salary}
                onChangeText={(text) => setFormData({ ...formData, salary: text })}
                placeholder="Contoh: 3000000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Bergabung</Text>
              <TextInput
                style={styles.input}
                value={formData.join_date}
                onChangeText={(text) => setFormData({ ...formData, join_date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusSelector}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusOption,
                      { borderColor: status.color },
                      formData.status === status.value && { backgroundColor: status.color }
                    ]}
                    onPress={() => setFormData({ ...formData, status: status.value })}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      { color: formData.status === status.value ? "white" : status.color }
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fcff",
  },
  header: {
    backgroundColor: "#9f7aea",
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
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
  },
  membersList: {
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: "white",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  memberInfo: {
    flexDirection: "row",
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 5,
  },
  memberBadges: {
    flexDirection: "row",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  memberActions: {
    flexDirection: "row",
    gap: 5,
  },
  actionButton: {
    padding: 8,
  },
  memberStats: {
    marginBottom: 15,
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: "#6b7280",
  },
  performanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 15,
  },
  performanceItem: {
    alignItems: "center",
  },
  performanceNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
  },
  performanceLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusActions: {
    marginTop: 10,
  },
  statusActionsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 10,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    opacity: 0.7,
  },
  statusButtonActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#2d3748",
  },
  statusButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusButtonTextActive: {
    color: "white",
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
  createButton: {
    backgroundColor: "#9f7aea",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
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
  saveButton: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9f7aea",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    backgroundColor: "white",
  },
  roleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
    minWidth: "45%",
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusSelector: {
    flexDirection: "row",
    gap: 10,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default TeamManagementScreen;