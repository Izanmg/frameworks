const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Rutes públiques
router.post("/register", authController.register);
router.post("/login", authController.login);

// Rutes de perfil (Usuari loguejat)
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);

// Rutes d'administració (Només Admin)
// Nota: He usat /admin/users dins d'aquest fitxer per simplificar, 
// però en app.js es munta sobre /api/auth, així que la ruta final és /api/auth/admin/users
router.get("/admin/users", protect, authorize("admin"), authController.getUsers);
router.delete("/admin/users/:id", protect, authorize("admin"), authController.deleteUser);
router.put("/admin/users/:id/role", protect, authorize("admin"), authController.changeUserRole);

module.exports = router;
