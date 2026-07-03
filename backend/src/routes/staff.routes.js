const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { addStaff, getAllStaff, getStaff, updateStaff, deleteStaff } = require("../controllers/staff.controller");

router.post("/", protect, addStaff);
router.get("/", protect, getAllStaff);
router.get("/:id", protect, getStaff);
router.put("/:id", protect, updateStaff);
router.delete("/:id", protect, deleteStaff);

module.exports = router;