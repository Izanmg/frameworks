// routes/userRoutes.js
// CRUD d'usuaris (T9)

const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

router.use(protect, auditMiddleware);

router.get("/", checkPermission("users:read"), userController.list);
router.get("/:id", checkPermission("users:read"), userController.getById);
router.put("/:id", checkPermission("users:manage"), userController.update);
router.delete("/:id", checkPermission("users:manage"), userController.remove);
router.get(
  "/:id/permissions",
  checkPermission("users:read"),
  userController.getPermissions
);

module.exports = router;
