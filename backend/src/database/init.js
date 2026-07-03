const db = require("../config/database");

// Initialize the database
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users ( 
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
, (err) => {
        if (err) {
            console.error("Table creation failed:" + err.message);
        } else {
            console.log("Users table ready.");
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            business_name TEXT NOT NULL,
            business_type TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            logo TEXT,
            qr_code TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`
    , (err) => {
        if (err) {
            console.error("Table creation failed:" + err.message);
        } else {
            console.log("Businesses table ready.");
        }
    });
    
    db.run(`
        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            phone TEXT NULL,
            photo TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id)
        )`
    , (err) => {
        if (err) {
            console.error("Staff table creation failed:" + err.message);
        } else {
            console.log("Staff table ready.");
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            
            business_rating INTEGER NOT NULL CHECK(business_rating >= 1 AND business_rating <= 5),
            business_comment TEXT,

            staff_id INTEGER,
            staff_rating INTEGER CHECK(staff_rating >= 1 AND staff_rating <= 5),
            staff_comment TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id),
            FOREIGN KEY (staff_id) REFERENCES staff(id)
        )`,
        (err) => {
            if (err) {
                console.error("Reviews table error:" + err.message);
            } else {
                console.log("Reviews table ready.");
            }
        }
    );
});