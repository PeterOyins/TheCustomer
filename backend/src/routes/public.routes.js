const express = require("express");
const router = express.Router();
const { getPublicStaff, submitReview } = require("../controllers/feedback.controller");

router.get("/:businessId/staff", getPublicStaff);
router.post("/:businessId/reviews", submitReview);

module.exports = router;