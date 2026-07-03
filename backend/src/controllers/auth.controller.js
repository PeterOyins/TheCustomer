const bcrypt = require("bcrypt");
const db = require("../config/database");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    //Basic validation
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required",
        });
    }

    // Check if the email already exists
    db.get(
        "SELECT * FROM users WHERE email = ?", 
        [email], 
        async (err, row) => {
            if (err) {
                return res.status(500).json({
                    message: "Server error",
                });
            }

            if (row) {
                return res.status(400).json({
                    message: "Email already exists",
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10); 

            db.run(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword],
                function (err) {
                    if (err) {
                        return res.status(500).json({
                            message: "Could not create user",
                        });
                    }

                    res.status(201).json({
                        message: "User created successfully",
                        UserId: this.lastID,
                    });
                }
            );
        }
    );
};

exports.login = (req, res) => {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    // Basic validation
    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                });
            }

            if (!user) {
                return res.status(401).json({
                    message: "Invalid email or password",
                });
            }
            
            const validPassword = await bcrypt.compare(
                password, 
                user.password);

            if (!validPassword) {
                return res.status(401).json({
                    message: "Invalid email or password",
                });
            }
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email 
                }, 
                process.env.JWT_SECRET, 
                { 
                    expiresIn: "7d" 
                }
            );

            res.json({
                message: "Login successful",
                token,
            });
        }
    );
};


module.exports = exports;