// routes/permissionRoutes.js
// CRUD de permisos (T9)

const express = require("express");
const router = express.Router();

const permissionController = require("../controllers/permissionController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

router.use(protect, auditMiddleware);

router.get(
  "/",
  checkPermission("permissions:read"),
  permissionController.list
);
router.get(
  "/:id",
  checkPermission("permissions:read"),
  permissionController.getById
);
router.post(
  "/",
  checkPermission("permissions:manage"),
  permissionController.create
);
router.put(
  "/:id",
  checkPermission("permissions:manage"),
  permissionController.update
);
router.delete(
  "/:id",
  checkPermission("permissions:manage"),
  permissionController.remove
);

module.exports = router;
