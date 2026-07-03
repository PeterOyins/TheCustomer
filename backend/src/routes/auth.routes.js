const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate.middleware");
const { register, login } = require("../controllers/auth.controller");

router.post("/register",
    [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    ],
    validate,
    register
);

router.post("/login",
    [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    ],
    validate,
    login
);

module.exports = router;