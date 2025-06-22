import * as SQLite from "expo-sqlite";

const database_name = "JasaIn.db";

let db;

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log("Initializing database...");

    try {
      db = SQLite.openDatabaseSync(database_name);
      console.log("Database opened successfully");

      createTables()
        .then(() => {
          console.log("Tables created successfully");
          insertDummyData()
            .then(() => {
              console.log("Database initialization completed");
              resolve(db);
            })
            .catch((error) => {
              console.log("Error inserting dummy data:", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Error creating tables:", error);
          reject(error);
        });
    } catch (error) {
      console.log("Error opening database:", error);
      reject(error);
    }
  });
};

// Initialize database tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    try {
      // Users table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL CHECK (role IN ('customer', 'umkm')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Services table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          umkm_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category TEXT NOT NULL,
          rating REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (umkm_id) REFERENCES users (id)
        );`
      );

      // Bookings table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          booking_date DATETIME NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
          total_price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES users (id),
          FOREIGN KEY (service_id) REFERENCES services (id)
        );`
      );

      // Reviews table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings (id),
          FOREIGN KEY (customer_id) REFERENCES users (id)
        );`
      );

      // Add service_id column to reviews table if it doesn't exist
      try {
        db.execSync(`ALTER TABLE reviews ADD COLUMN service_id INTEGER;`);
        console.log('Added service_id column to reviews table');
      } catch (error) {
        // Column might already exist, ignore error
        console.log('service_id column already exists or other error:', error.message);
      }

      // Add image column to users table if it doesn't exist
      try {
        db.execSync(`ALTER TABLE users ADD COLUMN image TEXT;`);
        console.log('Added image column to users table');
      } catch (error) {
        // Column might already exist, ignore error
        console.log('image column already exists or other error:', error.message);
      }

      // Add sender_type column to messages table if it doesn't exist
      try {
        db.execSync(`ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'customer';`);
        console.log('Added sender_type column to messages table');
      } catch (error) {
        // Column might already exist, ignore error
        console.log('sender_type column already exists or other error:', error.message);
      }

      // Chats table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          umkm_id INTEGER NOT NULL,
          last_message TEXT,
          last_message_time DATETIME,
          unread_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES users (id),
          FOREIGN KEY (umkm_id) REFERENCES users (id)
        );`
      );

      // Messages table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chat_id) REFERENCES chats (id),
          FOREIGN KEY (sender_id) REFERENCES users (id)
        );`
      );

      // Favorites table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          umkm_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES users (id),
          FOREIGN KEY (umkm_id) REFERENCES users (id),
          UNIQUE(customer_id, umkm_id)
        );`
      );

      // Notifications table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Promotions table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS promotions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          umkm_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          discount_percentage REAL,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (umkm_id) REFERENCES users (id)
        );`
      );

      // Schedules table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          umkm_id INTEGER NOT NULL,
          day_of_week TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          is_available BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (umkm_id) REFERENCES users (id)
        );`
      );

      // Team members table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS team_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          umkm_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (umkm_id) REFERENCES users (id)
        );`
      );

      // Payments table
      db.execSync(
        `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          method TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
          transaction_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings (id)
        );`
      );

      console.log("Database initialized successfully");
      resolve();
    } catch (error) {
      console.log("Database initialization error:", error);
      reject(error);
    }
  });
};

// Insert dummy data
const insertDummyData = () => {
  return new Promise((resolve, reject) => {
    try {
      // Clear existing dummy data first
      db.execSync(
        `DELETE FROM reviews WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email IN ('john@example.com')));`
      );
      db.execSync(
        `DELETE FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email IN ('john@example.com')) OR service_id IN (SELECT id FROM services WHERE umkm_id IN (SELECT id FROM users WHERE email IN ('laundry@example.com', 'ac@example.com', 'pangkas@example.com')));`
      );
      db.execSync(
        `DELETE FROM services WHERE umkm_id IN (SELECT id FROM users WHERE email IN ('laundry@example.com', 'ac@example.com', 'pangkas@example.com'));`
      );
      db.execSync(
        `DELETE FROM users WHERE email IN ('laundry@example.com', 'ac@example.com', 'pangkas@example.com', 'john@example.com');`
      );

      // Insert dummy UMKM users
      db.execSync(
        `INSERT INTO users (name, email, password, phone, role) VALUES 
        ('Laundry Bersih', 'laundry@example.com', 'password123', '081234567890', 'umkm'),
        ('Servis AC Dingin', 'ac@example.com', 'password123', '081234567891', 'umkm'),
        ('Pangkas Rambut Keren', 'pangkas@example.com', 'password123', '081234567892', 'umkm');`
      );

      // Insert dummy customer
      db.execSync(
        `INSERT INTO users (name, email, password, phone, role) VALUES 
        ('John Doe', 'john@example.com', 'password123', '081234567893', 'customer');`
      );

      // Get the inserted user IDs
      const laundryUser = db.getFirstSync(
        "SELECT id FROM users WHERE email = ?",
        ["laundry@example.com"]
      );
      const acUser = db.getFirstSync("SELECT id FROM users WHERE email = ?", [
        "ac@example.com",
      ]);
      const pangkasUser = db.getFirstSync(
        "SELECT id FROM users WHERE email = ?",
        ["pangkas@example.com"]
      );
      const customerUser = db.getFirstSync(
        "SELECT id FROM users WHERE email = ?",
        ["john@example.com"]
      );

      // Insert dummy services
      db.execSync(
        `INSERT INTO services (umkm_id, name, description, price, category, rating) VALUES 
        (${laundryUser.id}, 'Cuci Kering', 'Layanan cuci dan kering pakaian', 15000, 'Laundry', 4.5),
        (${laundryUser.id}, 'Cuci Setrika', 'Layanan cuci, kering, dan setrika', 20000, 'Laundry', 4.8),
        (${acUser.id}, 'Service AC 1/2 PK', 'Pembersihan dan perawatan AC', 75000, 'Servis AC', 4.2),
        (${acUser.id}, 'Service AC 1 PK', 'Pembersihan dan perawatan AC', 100000, 'Servis AC', 4.3),
        (${pangkasUser.id}, 'Potong Rambut Pria', 'Potong rambut model terkini', 25000, 'Pangkas Rambut', 4.7),
        (${pangkasUser.id}, 'Potong + Keramas', 'Potong rambut dan keramas', 35000, 'Pangkas Rambut', 4.6);`
      );

      // Get service IDs
      const cuciKeringService = db.getFirstSync(
        "SELECT id FROM services WHERE name = ? AND umkm_id = ?",
        ["Cuci Kering", laundryUser.id]
      );
      const serviceACService = db.getFirstSync(
        "SELECT id FROM services WHERE name = ? AND umkm_id = ?",
        ["Service AC 1/2 PK", acUser.id]
      );

      // Insert dummy bookings
      db.execSync(
        `INSERT INTO bookings (customer_id, service_id, booking_date, status, total_price) VALUES 
        (${customerUser.id}, ${cuciKeringService.id}, '2024-01-15 10:00:00', 'completed', 15000),
        (${customerUser.id}, ${serviceACService.id}, '2024-01-20 14:00:00', 'pending', 75000);`
      );

      // Get booking IDs
      const completedBooking = db.getFirstSync(
        "SELECT id FROM bookings WHERE customer_id = ? AND service_id = ? AND status = ?",
        [customerUser.id, cuciKeringService.id, "completed"]
      );

      // Insert dummy reviews
      db.execSync(
        `INSERT INTO reviews (booking_id, customer_id, service_id, rating, comment) VALUES 
        (${completedBooking.id}, ${customerUser.id}, ${cuciKeringService.id}, 5, 'Pelayanan sangat baik dan cepat!');`
      );

      // Insert dummy chats
      db.execSync(
        `INSERT INTO chats (customer_id, umkm_id, last_message, last_message_time, unread_count) VALUES 
        (${customerUser.id}, ${laundryUser.id}, 'Terima kasih atas pelayanannya!', '2024-01-15 15:30:00', 0),
        (${customerUser.id}, ${acUser.id}, 'Kapan bisa datang untuk service AC?', '2024-01-20 09:15:00', 1);`
      );

      // Get chat IDs for messages
      const laundryChat = db.getFirstSync(
        "SELECT id FROM chats WHERE customer_id = ? AND umkm_id = ?",
        [customerUser.id, laundryUser.id]
      );
      const acChat = db.getFirstSync(
        "SELECT id FROM chats WHERE customer_id = ? AND umkm_id = ?",
        [customerUser.id, acUser.id]
      );

      // Insert dummy messages
      db.execSync(
        `INSERT INTO messages (chat_id, sender_id, message, is_read) VALUES 
        (${laundryChat.id}, ${customerUser.id}, 'Halo, saya ingin tanya tentang layanan laundry', 1),
        (${laundryChat.id}, ${laundryUser.id}, 'Halo! Ada yang bisa kami bantu?', 1),
        (${laundryChat.id}, ${customerUser.id}, 'Terima kasih atas pelayanannya!', 1),
        (${acChat.id}, ${customerUser.id}, 'Kapan bisa datang untuk service AC?', 1),
        (${acChat.id}, ${acUser.id}, 'Besok pagi bisa pak, jam 9', 0);`
      );

      // Insert dummy favorites
      db.execSync(
        `INSERT INTO favorites (customer_id, umkm_id) VALUES 
        (${customerUser.id}, ${laundryUser.id}),
        (${customerUser.id}, ${pangkasUser.id});`
      );

      // Insert dummy notifications
      db.execSync(
        `INSERT INTO notifications (user_id, title, message, type, is_read) VALUES 
        (${customerUser.id}, 'Booking Dikonfirmasi', 'Booking Anda untuk layanan Cuci Kering telah dikonfirmasi', 'booking_status', 1),
        (${customerUser.id}, 'Pesan Baru', 'Anda memiliki pesan baru dari Servis AC Dingin', 'chat', 0),
        (${customerUser.id}, 'Promosi Spesial', 'Diskon 20% untuk layanan pangkas rambut!', 'promotion', 0),
        (${laundryUser.id}, 'Review Baru', 'Anda mendapat review baru dari pelanggan', 'review', 0);`
      );

      // Insert dummy promotions
      db.execSync(
        `INSERT INTO promotions (umkm_id, title, description, discount_percentage, start_date, end_date, is_active) VALUES 
        (${laundryUser.id}, 'Promo Cuci Setrika', 'Diskon 15% untuk layanan cuci setrika', 15, '2024-01-01', '2024-01-31', 1),
        (${pangkasUser.id}, 'Promo Potong Rambut', 'Diskon 20% untuk semua layanan potong rambut', 20, '2024-01-15', '2024-02-15', 1);`
      );

      // Insert dummy schedules
      db.execSync(
        `INSERT INTO schedules (umkm_id, day_of_week, start_time, end_time, is_available) VALUES 
        (${laundryUser.id}, 'Senin', '08:00', '17:00', 1),
        (${laundryUser.id}, 'Selasa', '08:00', '17:00', 1),
        (${laundryUser.id}, 'Rabu', '08:00', '17:00', 1),
        (${acUser.id}, 'Senin', '09:00', '16:00', 1),
        (${acUser.id}, 'Selasa', '09:00', '16:00', 1),
        (${pangkasUser.id}, 'Senin', '10:00', '20:00', 1);`
      );

      // Insert dummy team members
      db.execSync(
        `INSERT INTO team_members (umkm_id, name, role, phone, email, status) VALUES 
        (${laundryUser.id}, 'Budi Santoso', 'Operator Mesin', '081234567894', 'budi@laundry.com', 'active'),
        (${laundryUser.id}, 'Sari Dewi', 'Customer Service', '081234567895', 'sari@laundry.com', 'active'),
        (${acUser.id}, 'Ahmad Teknisi', 'Teknisi Senior', '081234567896', 'ahmad@ac.com', 'active'),
        (${pangkasUser.id}, 'Rudi Barber', 'Tukang Cukur', '081234567897', 'rudi@pangkas.com', 'active');`
      );

      // Insert dummy payments
      db.execSync(
        `INSERT INTO payments (booking_id, amount, method, status, transaction_id) VALUES 
        (${completedBooking.id}, 15000, 'cash', 'completed', 'TXN001'),
        ((SELECT id FROM bookings WHERE customer_id = ${customerUser.id} AND service_id = ${serviceACService.id}), 75000, 'transfer', 'pending', 'TXN002');`
      );

      console.log("Dummy data inserted successfully");
      resolve();
    } catch (error) {
      console.log("Dummy data insertion error:", error);
      reject(error);
    }
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return db;
};

export { initializeDatabase, getDatabase };
export default getDatabase;
