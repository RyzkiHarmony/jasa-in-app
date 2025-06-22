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
      // Insert dummy UMKM users
      db.execSync(
        `INSERT OR IGNORE INTO users (name, email, password, phone, role) VALUES 
        ('Laundry Bersih', 'laundry@example.com', 'password123', '081234567890', 'umkm'),
        ('Servis AC Dingin', 'ac@example.com', 'password123', '081234567891', 'umkm'),
        ('Pangkas Rambut Keren', 'pangkas@example.com', 'password123', '081234567892', 'umkm');`
      );

      // Insert dummy customer
      db.execSync(
        `INSERT OR IGNORE INTO users (name, email, password, phone, role) VALUES 
        ('John Doe', 'john@example.com', 'password123', '081234567893', 'customer');`
      );

      // Insert dummy services
      db.execSync(
        `INSERT OR IGNORE INTO services (umkm_id, name, description, price, category, rating) VALUES 
        (1, 'Cuci Kering', 'Layanan cuci dan kering pakaian', 15000, 'Laundry', 4.5),
        (1, 'Cuci Setrika', 'Layanan cuci, kering, dan setrika', 20000, 'Laundry', 4.8),
        (2, 'Service AC 1/2 PK', 'Pembersihan dan perawatan AC', 75000, 'Servis AC', 4.2),
        (2, 'Service AC 1 PK', 'Pembersihan dan perawatan AC', 100000, 'Servis AC', 4.3),
        (3, 'Potong Rambut Pria', 'Potong rambut model terkini', 25000, 'Pangkas Rambut', 4.7),
        (3, 'Potong + Keramas', 'Potong rambut dan keramas', 35000, 'Pangkas Rambut', 4.6);`
      );

      // Insert dummy bookings
      db.execSync(
        `INSERT OR IGNORE INTO bookings (customer_id, service_id, booking_date, status, total_price) VALUES 
        (4, 1, '2024-01-15 10:00:00', 'completed', 15000),
        (4, 3, '2024-01-20 14:00:00', 'pending', 75000);`
      );

      // Insert dummy reviews
      db.execSync(
        `INSERT OR IGNORE INTO reviews (booking_id, customer_id, rating, comment) VALUES 
        (1, 4, 5, 'Pelayanan sangat baik dan cepat!'),
        (1, 4, 4, 'Hasil cuci bersih, harga terjangkau');`
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
