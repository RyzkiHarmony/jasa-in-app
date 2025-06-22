# JASA-IN Mobile App

Aplikasi mobile untuk platform layanan jasa berbasis React Native dengan Expo dan SQLite.

## Fitur Utama

### Untuk Customer:

- **Autentikasi**: Login dan registrasi pengguna
- **Pencarian Jasa**: Browse dan cari layanan yang tersedia
- **Booking**: Pesan layanan dengan form booking lengkap
- **Riwayat**: Lihat riwayat pemesanan
- **Review**: Berikan rating dan ulasan untuk layanan
- **Favorit**: Simpan UMKM favorit untuk akses cepat
- **Chat**: Komunikasi langsung dengan UMKM
- **Notifikasi**: Terima pemberitahuan penting
- **Profil**: Kelola informasi profil pengguna

### Untuk UMKM:

- **Dashboard**: Statistik dan overview bisnis
- **Kelola Booking**: Terima, konfirmasi, dan kelola pesanan
- **Kelola Layanan**: Tambah, edit, dan hapus layanan
- **Chat**: Komunikasi dengan customer
- **Notifikasi**: Terima pemberitahuan pesanan dan pesan
- **Profil**: Kelola informasi UMKM

## Teknologi yang Digunakan

- **React Native** dengan Expo
- **SQLite** untuk database lokal
- **React Navigation** untuk navigasi
- **React Context** untuk state management
- **Expo DateTimePicker** untuk pemilihan tanggal
- **React Native Picker** untuk dropdown

## Struktur Database

### Tabel Users

- id (PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT)
- phone (TEXT)
- role (TEXT) - 'customer' atau 'umkm'

### Tabel Services

- id (PRIMARY KEY)
- umkm_id (FOREIGN KEY)
- name (TEXT)
- description (TEXT)
- price (REAL)
- category (TEXT)
- rating (REAL)

### Tabel Bookings

- id (PRIMARY KEY)
- customer_id (FOREIGN KEY)
- service_id (FOREIGN KEY)
- booking_date (TEXT)
- booking_time (TEXT)
- notes (TEXT)
- status (TEXT) - 'pending', 'confirmed', 'completed', 'cancelled'
- total_price (REAL)

### Tabel Reviews

- id (PRIMARY KEY)
- booking_id (FOREIGN KEY)
- customer_id (FOREIGN KEY)
- service_id (FOREIGN KEY)
- rating (INTEGER)
- comment (TEXT)

### Tabel Favorites

- id (PRIMARY KEY)
- customer_id (FOREIGN KEY)
- umkm_id (FOREIGN KEY)
- created_at (TEXT)

### Tabel Chats

- id (PRIMARY KEY)
- customer_id (FOREIGN KEY)
- umkm_id (FOREIGN KEY)
- last_message (TEXT)
- last_message_time (TEXT)
- unread_count (INTEGER)
- created_at (TEXT)

### Tabel Messages

- id (PRIMARY KEY)
- chat_id (FOREIGN KEY)
- sender_id (FOREIGN KEY)
- sender_type (TEXT) - 'customer' atau 'umkm'
- message (TEXT)
- timestamp (TEXT)
- is_read (INTEGER)

### Tabel Notifications

- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- title (TEXT)
- message (TEXT)
- type (TEXT)
- is_read (INTEGER)
- created_at (TEXT)

## Instalasi dan Menjalankan Aplikasi

### Prasyarat

- Node.js (versi 14 atau lebih baru)
- npm atau yarn
- Expo CLI
- Expo Go app di smartphone (untuk testing)

### Langkah Instalasi

1. **Clone atau download project**

   ```bash
   cd JasaInApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Jalankan aplikasi**

   ```bash
   npx expo start
   ```

4. **Testing di device**
   - Install Expo Go dari Play Store/App Store
   - Scan QR code yang muncul di terminal/browser
   - Atau jalankan di emulator Android/iOS

## Akun Demo

Aplikasi sudah dilengkapi dengan data dummy untuk testing:

### Customer Demo:

- **Email**: customer@demo.com
- **Password**: password123

### UMKM Demo:

- **Email**: umkm@demo.com
- **Password**: password123

## Struktur Folder

```
src/
├── components/
│   └── Navigation.js          # Konfigurasi navigasi utama
├── context/
│   └── AuthContext.js         # Context untuk autentikasi
├── database/
│   └── database.js            # Konfigurasi dan inisialisasi SQLite
├── screens/
│   ├── LoginScreen.js         # Screen login
│   ├── RegisterScreen.js      # Screen registrasi
│   ├── customer/              # Screens untuk customer
│   │   ├── HomeScreen.js
│   │   ├── BookingFormScreen.js
│   │   ├── BookingHistoryScreen.js
│   │   ├── ReviewFormScreen.js
│   │   ├── FavoritesScreen.js
│   │   ├── ChatScreen.js
│   │   ├── ChatDetailScreen.js
│   │   ├── NotificationsScreen.js
│   │   └── ProfileScreen.js
│   └── umkm/                  # Screens untuk UMKM
│       ├── DashboardScreen.js
│       ├── ManageBookingsScreen.js
│       ├── ManageServicesScreen.js
│       ├── ChatScreen.js
│       └── NotificationsScreen.js
└── utils/                     # Utility functions (jika diperlukan)
```

## Fitur yang Diimplementasikan

✅ **Autentikasi lengkap** (login, register, logout)
✅ **Database SQLite** dengan skema lengkap
✅ **Navigasi berbasis role** (customer vs UMKM)
✅ **CRUD layanan** untuk UMKM
✅ **Sistem booking** dengan form lengkap
✅ **Manajemen booking** untuk UMKM
✅ **Sistem review dan rating**
✅ **Sistem favorit** untuk customer
✅ **Sistem chat** real-time antara customer dan UMKM
✅ **Sistem notifikasi** untuk kedua role
✅ **Dashboard statistik** untuk UMKM
✅ **Profil pengguna** yang dapat diedit
✅ **Data dummy** untuk testing

## Catatan Pengembangan

- Database SQLite akan otomatis dibuat saat aplikasi pertama kali dijalankan
- Data dummy akan diinsert otomatis jika tabel kosong
- Aplikasi menggunakan Context API untuk state management global
- Semua screen sudah responsive dan mengikuti design pattern yang konsisten
- Error handling sudah diimplementasikan di semua operasi database

## Troubleshooting

### Jika aplikasi tidak bisa dijalankan:

1. Pastikan semua dependencies sudah terinstall dengan benar
2. Clear cache Expo: `npx expo start --clear`
3. Restart Metro bundler
4. Pastikan tidak ada port conflict

### Jika database error:

1. Database akan otomatis dibuat ulang jika corrupt
2. Data dummy akan diinsert ulang jika tabel kosong
3. Check console log untuk error details

## Kontribusi

Untuk pengembangan lebih lanjut:

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

## Lisensi

Project ini dibuat untuk keperluan tugas kuliah.
