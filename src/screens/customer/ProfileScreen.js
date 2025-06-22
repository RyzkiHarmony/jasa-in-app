import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import getDatabase from '../../database/database';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleUpdateProfile = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    setLoading(true);
    
    try {
      const db = getDatabase();
      db.runSync(
        'UPDATE users SET name = ?, phone = ? WHERE id = ?',
        [name.trim(), phone.trim(), user.id]
      );
      
      setLoading(false);
      setEditing(false);
      Alert.alert('Sukses', 'Profil berhasil diperbarui');
      // Update user context would require additional implementation
    } catch (error) {
      setLoading(false);
      console.log('Profile update error:', error);
      Alert.alert('Error', 'Gagal memperbarui profil');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya', onPress: logout }
      ]
    );
  };

  const cancelEdit = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Icon name="person" size={30} color="#48bb78" />
            <View>
              <Text style={styles.headerTitle}>Profil Saya</Text>
              <Text style={styles.headerSubtitle}>Kelola informasi akun Anda</Text>
            </View>
          </View>
          <View style={styles.decorativeElements}>
            <Icon name="settings" size={24} color="#48bb78" />
              <Icon name="edit" size={24} color="#48bb78" />
          </View>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={name}
              onChangeText={setName}
              editable={editing}
              placeholder="Nama lengkap"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
              placeholder="Email"
            />
            <Text style={styles.helperText}>Email tidak dapat diubah</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              editable={editing}
              placeholder="Nomor telepon"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.role === 'customer' ? 'Customer' : 'UMKM'}
              editable={false}
            />
          </View>

          {editing ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={cancelEdit}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Profil</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Aksi</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>Bantuan & FAQ</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>Tentang Aplikasi</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>JASA-IN v1.0</Text>
        <Text style={styles.footerText}>Platform Jasa UMKM</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fcff',
  },
  header: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  profileIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  decorativeElements: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  editIcon: {
    fontSize: 24,
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
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 25,
    padding: 28,
    elevation: 8,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#48bb78',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#48bb78',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fcff',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#c6f6d5',
    color: '#2d3748',
    elevation: 2,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#48bb78',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#48bb78',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    padding: 24,
    elevation: 6,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#48bb78',
    marginBottom: 15,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  actionArrow: {
    fontSize: 20,
    color: '#666',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ProfileScreen;