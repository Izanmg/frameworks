// routes/authRoutes.js
// Rutes d'autenticació (T9): register, login, refresh, logout, forgot/reset password

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");
const handleValidation = require("../middleware/validators/handleValidation");
const {
  registerValidators,
  loginValidators,
  refreshValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require("../middleware/validators/authValidators");

// Públiques
router.post("/register", registerValidators, handleValidation, authController.register);
router.post("/login", loginValidators, handleValidation, authController.login);
router.post("/refresh", refreshValidators, handleValidation, authController.refresh);
router.post(
  "/forgot-password",
  forgotPasswordValidators,
  handleValidation,
  authController.forgotPassword
);
router.post(
  "/reset-password/:token",
  resetPasswordValidators,
  handleValidation,
  authController.resetPassword
);

// Privades
router.post("/logout", protect, auditMiddleware, authController.logout);
router.get("/me", protect, authController.me);

module.exports = router;
