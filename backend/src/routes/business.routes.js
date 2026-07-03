const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { createBusiness, getBusiness, updateBusiness, deleteBusiness } = require("../controllers/business.controller");

router.post("/", protect, createBusiness);
router.get("/", protect, getBusiness);
router.put("/:id", protect, updateBusiness);
router.delete("/:id", protect, deleteBusiness);

module.exports = router;