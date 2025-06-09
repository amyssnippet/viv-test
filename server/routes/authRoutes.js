const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post('/social-auth', authController.socialAuth);
router.post('/apple/callback', authController.appleCallback);

module.exports = router;
