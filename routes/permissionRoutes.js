const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");
const {
  createPermissionValidators,
  updatePermissionValidators,
} = require("../middleware/validators/permissionValidators");
const handleValidation = require("../middleware/validators/handleValidation");

router.use(protect, auditMiddleware);

router.post(
  "/",
  checkPermission("permissions:manage"),
  createPermissionValidators,
  handleValidation,
  permissionController.createPermission
);

router.get(
  "/",
  checkPermission("permissions:manage"),
  permissionController.getAllPermissions
);

router.get(
  "/categories",
  checkPermission("permissions:manage"),
  permissionController.getCategories
);

router.put(
  "/:id",
  checkPermission("permissions:manage"),
  updatePermissionValidators,
  handleValidation,
  permissionController.updatePermission
);

router.delete(
  "/:id",
  checkPermission("permissions:manage"),
  permissionController.deletePermission
);

module.exports = router;
