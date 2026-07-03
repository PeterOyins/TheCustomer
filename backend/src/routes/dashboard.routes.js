const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware")
const { getDashboard, getBusinessReviews, getStaffReviews } = require("../controllers/dashboard.controller");

router.get("/", protect, getDashboard);
router.get("/reviews", protect, getBusinessReviews);
router.get("/staff/:staffId/reviews", protect, getStaffReviews);

module.exports = router;