/**
 * Utilitas untuk menangani zona waktu UTC+7 Jakarta
 * Memastikan konsistensi format tanggal dan waktu di seluruh aplikasi
 */

// Zona waktu Jakarta (UTC+7)
const JAKARTA_TIMEZONE = 'Asia/Jakarta';
const JAKARTA_OFFSET = 7 * 60; // 7 jam dalam menit

/**
 * Mendapatkan tanggal saat ini dalam zona waktu Jakarta
 * @returns {Date} Tanggal saat ini dalam zona waktu Jakarta
 */
export const getCurrentJakartaTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jakartaTime = new Date(utc + (JAKARTA_OFFSET * 60000));
  return jakartaTime;
};

/**
 * Mengkonversi tanggal ke zona waktu Jakarta
 * @param {Date|string} date - Tanggal yang akan dikonversi
 * @returns {Date} Tanggal dalam zona waktu Jakarta
 */
export const toJakartaTime = (date) => {
  const inputDate = new Date(date);
  const utc = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000);
  const jakartaTime = new Date(utc + (JAKARTA_OFFSET * 60000));
  return jakartaTime;
};

/**
 * Format tanggal untuk tampilan dengan zona waktu Jakarta
 * @param {Date|string} date - Tanggal yang akan diformat
 * @param {Object} options - Opsi format (opsional)
 * @returns {string} Tanggal yang diformat
 */
export const formatDateJakarta = (date, options = {}) => {
  const jakartaDate = toJakartaTime(date);
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: JAKARTA_TIMEZONE,
    ...options
  };
  
  return jakartaDate.toLocaleDateString('id-ID', defaultOptions);
};

/**
 * Format waktu untuk tampilan dengan zona waktu Jakarta
 * @param {Date|string} date - Tanggal yang akan diformat
 * @param {Object} options - Opsi format (opsional)
 * @returns {string} Waktu yang diformat
 */
export const formatTimeJakarta = (date, options = {}) => {
  const jakartaDate = toJakartaTime(date);
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: JAKARTA_TIMEZONE,
    ...options
  };
  
  return jakartaDate.toLocaleTimeString('id-ID', defaultOptions);
};

/**
 * Format tanggal dan waktu lengkap dengan zona waktu Jakarta
 * @param {Date|string} date - Tanggal yang akan diformat
 * @returns {string} Tanggal dan waktu yang diformat
 */
export const formatDateTimeJakarta = (date) => {
  const jakartaDate = toJakartaTime(date);
  return jakartaDate.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: JAKARTA_TIMEZONE
  });
};

/**
 * Format tanggal singkat (DD/MM/YYYY) dengan zona waktu Jakarta
 * @param {Date|string} date - Tanggal yang akan diformat
 * @returns {string} Tanggal dalam format singkat
 */
export const formatDateShortJakarta = (date) => {
  const jakartaDate = toJakartaTime(date);
  return jakartaDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: JAKARTA_TIMEZONE
  });
};

/**
 * Mendapatkan timestamp ISO string dalam zona waktu Jakarta
 * @param {Date} date - Tanggal (opsional, default: sekarang)
 * @returns {string} ISO string dalam zona waktu Jakarta
 */
export const getJakartaISOString = (date = null) => {
  const targetDate = date ? toJakartaTime(date) : getCurrentJakartaTime();
  return targetDate.toISOString();
};

/**
 * Format relatif waktu (misal: "2 jam yang lalu") dengan zona waktu Jakarta
 * @param {Date|string} date - Tanggal yang akan dibandingkan
 * @returns {string} Waktu relatif
 */
export const formatRelativeTimeJakarta = (date) => {
  const jakartaDate = toJakartaTime(date);
  const now = getCurrentJakartaTime();
  const diffInMs = now - jakartaDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Baru saja';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} menit yang lalu`;
  } else if (diffInHours < 24) {
    return `${diffInHours} jam yang lalu`;
  } else if (diffInDays < 7) {
    return `${diffInDays} hari yang lalu`;
  } else {
    return formatDateJakarta(jakartaDate);
  }
};

/**
 * Validasi apakah tanggal booking valid (tidak di masa lalu)
 * @param {Date|string} bookingDate - Tanggal booking
 * @returns {boolean} True jika valid
 */
export const isValidBookingDate = (bookingDate) => {
  const booking = toJakartaTime(bookingDate);
  const now = getCurrentJakartaTime();
  
  // Set waktu ke awal hari untuk perbandingan tanggal saja
  booking.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return booking >= now;
};

/**
 * Format harga dengan pemisah ribuan
 * @param {number} price - Harga
 * @returns {string} Harga yang diformat
 */
export const formatPrice = (price) => {
  return `Rp ${price?.toLocaleString('id-ID') || 0}`;
};

/**
 * Mendapatkan tanggal minimum untuk DateTimePicker (hari ini dalam zona Jakarta)
 * @returns {Date} Tanggal minimum
 */
export const getMinimumDate = () => {
  return getCurrentJakartaTime();
};

/**
 * Konversi tanggal untuk disimpan di database (ISO string)
 * @param {Date} date - Tanggal
 * @returns {string} ISO string untuk database
 */
export const toDBFormat = (date) => {
  return toJakartaTime(date).toISOString();
};

/**
 * Parse tanggal dari database dan konversi ke zona Jakarta
 * @param {string} dbDateString - String tanggal dari database
 * @returns {Date} Tanggal dalam zona Jakarta
 */
export const fromDBFormat = (dbDateString) => {
  return toJakartaTime(dbDateString);
};