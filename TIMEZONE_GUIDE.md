# Panduan Zona Waktu UTC+7 Jakarta - JasaIn App

## Overview
Aplikasi JasaIn menggunakan zona waktu UTC+7 Jakarta secara konsisten di seluruh aplikasi untuk memastikan semua pengguna di Indonesia mendapatkan waktu yang akurat.

## Utilitas Zona Waktu
File `src/utils/dateUtils.js` menyediakan berbagai fungsi untuk menangani zona waktu Jakarta:

### Fungsi Utama

#### `getCurrentJakartaTime()`
- Mendapatkan waktu saat ini dalam zona waktu Jakarta
- Digunakan untuk: timestamp baru, validasi tanggal, perbandingan waktu

#### `toJakartaTime(date)`
- Mengkonversi tanggal ke zona waktu Jakarta
- Parameter: Date object atau string
- Return: Date object dalam zona Jakarta

#### `formatDateJakarta(date, options)`
- Format tanggal untuk tampilan dengan zona Jakarta
- Parameter: date (Date/string), options (object opsional)
- Return: string tanggal yang diformat

#### `formatTimeJakarta(date, options)`
- Format waktu untuk tampilan dengan zona Jakarta
- Parameter: date (Date/string), options (object opsional)
- Return: string waktu yang diformat

#### `formatDateTimeJakarta(date)`
- Format tanggal dan waktu lengkap
- Return: string "DD MMMM YYYY, HH:mm"

#### `formatRelativeTimeJakarta(date)`
- Format waktu relatif ("2 jam yang lalu", "Kemarin", dll)
- Digunakan untuk: chat timestamps, notifikasi

#### `formatPrice(price)`
- Format harga dengan pemisah ribuan Indonesia
- Return: "Rp 1.000.000"

### Fungsi Database

#### `toDBFormat(date)`
- Konversi tanggal untuk disimpan di database (ISO string)
- Digunakan saat: INSERT/UPDATE data dengan timestamp

#### `fromDBFormat(dbDateString)`
- Parse tanggal dari database ke zona Jakarta
- Digunakan saat: membaca data dari database

### Fungsi Validasi

#### `isValidBookingDate(bookingDate)`
- Validasi apakah tanggal booking valid (tidak di masa lalu)
- Return: boolean

#### `getMinimumDate()`
- Mendapatkan tanggal minimum untuk DateTimePicker
- Return: Date object hari ini dalam zona Jakarta

## Implementasi di Komponen

### 1. Booking Form
```javascript
import { getCurrentJakartaTime, formatDateTimeJakarta, isValidBookingDate, toDBFormat, getMinimumDate } from '../../utils/dateUtils';

// Inisialisasi tanggal
const [bookingDate, setBookingDate] = useState(getCurrentJakartaTime());

// Validasi
if (!isValidBookingDate(bookingDate)) {
  Alert.alert('Error', 'Tanggal booking tidak boleh di masa lalu');
}

// Simpan ke database
db.runSync('INSERT INTO bookings (...) VALUES (...)', [..., toDBFormat(bookingDate), ...]);

// DateTimePicker
<DateTimePicker minimumDate={getMinimumDate()} />
```

### 2. Chat Timestamps
```javascript
import { formatTimeJakarta, formatRelativeTimeJakarta } from '../../utils/dateUtils';

// Waktu pesan
<Text>{formatTimeJakarta(message.created_at)}</Text>

// Waktu relatif di daftar chat
<Text>{formatRelativeTimeJakarta(chat.last_message_time)}</Text>
```

### 3. Format Harga
```javascript
import { formatPrice } from '../../utils/dateUtils';

// Tampilan harga
<Text>{formatPrice(service.price)}</Text> // "Rp 150.000"
```

### 4. Riwayat dan Laporan
```javascript
import { formatDateJakarta, getCurrentJakartaTime } from '../../utils/dateUtils';

// Tanggal booking
<Text>{formatDateJakarta(booking.booking_date, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}</Text>

// Analitik berdasarkan periode
const now = getCurrentJakartaTime();
const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
```

## File yang Telah Diperbarui

### Customer Screens
- `BookingFormScreen.js` - Form booking dengan validasi tanggal Jakarta
- `BookingHistoryScreen.js` - Riwayat booking dengan format tanggal Jakarta
- `ChatScreen.js` - Daftar chat dengan waktu relatif Jakarta
- `ChatDetailScreen.js` - Detail chat dengan timestamp Jakarta
- `NotificationsScreen.js` - Notifikasi dengan waktu relatif Jakarta
- `ReviewFormScreen.js` - Form review dengan tanggal Jakarta
- `HomeScreen.js` - Halaman utama dengan format harga
- `UmkmDetailScreen.js` - Detail UMKM dengan format harga
- `FavoritesScreen.js` - Favorit dengan format harga
- `AdvancedSearchScreen.js` - Pencarian dengan format harga

### UMKM Screens
- `DashboardScreen.js` - Dashboard dengan format tanggal dan harga Jakarta
- `ManageBookingsScreen.js` - Kelola booking dengan format tanggal Jakarta
- `AnalyticsScreen.js` - Analitik dengan periode Jakarta
- `ChatScreen.js` - Chat UMKM dengan waktu relatif Jakarta
- `ChatDetailScreen.js` - Detail chat UMKM dengan timestamp Jakarta
- `TeamManagementScreen.js` - Manajemen tim dengan tanggal Jakarta
- `PromotionsScreen.js` - Promosi dengan periode Jakarta
- `ScheduleScreen.js` - Jadwal dengan tanggal Jakarta
- `ManageServicesScreen.js` - Kelola layanan dengan format harga

### Common Screens
- `ReviewsScreen.js` - Review dengan format tanggal Jakarta
- `PaymentScreen.js` - Pembayaran dengan format tanggal dan harga Jakarta
- `MapScreen.js` - Peta dengan format harga Indonesia

## Konsistensi Format

### Format Tanggal
- **Tanggal Lengkap**: "Senin, 15 Januari 2024"
- **Tanggal Singkat**: "15/01/2024"
- **Waktu**: "14:30"
- **Tanggal Waktu**: "15 Januari 2024, 14:30"
- **Relatif**: "2 jam yang lalu", "Kemarin", "3 hari yang lalu"

### Format Harga
- **Standard**: "Rp 150.000"
- **Dengan prefix**: "Mulai Rp 50.000"
- **Diskon**: "Rp 25.000 off"

## Best Practices

1. **Selalu gunakan utilitas dari `dateUtils.js`** untuk konsistensi
2. **Jangan gunakan `new Date()` langsung** - gunakan `getCurrentJakartaTime()`
3. **Untuk database**: gunakan `toDBFormat()` saat menyimpan, `fromDBFormat()` saat membaca
4. **Untuk tampilan**: gunakan fungsi format yang sesuai (`formatDateJakarta`, `formatTimeJakarta`, dll)
5. **Untuk validasi**: gunakan `isValidBookingDate()` untuk tanggal booking
6. **Untuk harga**: selalu gunakan `formatPrice()` untuk konsistensi

## Testing

Pastikan untuk menguji:
- Pembuatan booking dengan tanggal hari ini dan masa depan
- Chat timestamps menampilkan waktu yang benar
- Notifikasi menampilkan waktu relatif yang akurat
- Format harga konsisten di seluruh aplikasi
- Analitik menampilkan data berdasarkan periode Jakarta

## Catatan Penting

- Zona waktu Jakarta (UTC+7) diterapkan secara konsisten
- Semua timestamp database menggunakan format ISO dengan konversi Jakarta
- Format Indonesia (`id-ID`) digunakan untuk tampilan tanggal dan harga
- Validasi tanggal mempertimbangkan zona waktu Jakarta
- Waktu relatif dihitung berdasarkan waktu Jakarta