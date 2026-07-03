// backend/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();
require("./src/database/init"); // Initialize the databases

const authRoutes = require("./src/routes/auth.routes");
const businessRoutes = require("./src/routes/business.routes");
const staffRoutes = require("./src/routes/staff.routes");
const publicRoutes = require("./src/routes/public.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const rateLimit = require("express-rate-limit");

const app = express();



// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: "Too many attempts, please try again after 15 minutes",
});

// Routes
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);


// Redirect QR code scans to the frontend feedback page
app.get("/feedback/:businessId", (req, res) => {
    res.redirect(`/feedback.html?businessId=${req.params.businessId}`);
});

// 404 for unmatched API routes (must be before static files)
app.use("/api/*path", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// Serve frontend static files — must come after API routes
app.use(express.static(path.join(__dirname, "../frontend")));

app.use((err,req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ 
        message: err.message || "Something went wrong on the server", });
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}`);
});