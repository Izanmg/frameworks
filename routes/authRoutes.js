const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

// Rutes públiques
router.post("/register", authController.register);
router.post("/login", authController.login);

// Rutes de perfil (Usuari loguejat)
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);

// Verificar permís
router.post(
  "/check-permission",
  protect,
  auditMiddleware,
  authController.checkPermission
);

module.exports = router;
