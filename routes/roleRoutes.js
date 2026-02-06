const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");
const {
  createRoleValidators,
  updateRoleValidators,
} = require("../middleware/validators/roleValidators");
const handleValidation = require("../middleware/validators/handleValidation");

router.use(protect, auditMiddleware);

router.post(
  "/",
  checkPermission("roles:manage"),
  createRoleValidators,
  handleValidation,
  roleController.createRole
);

router.get("/", checkPermission("roles:read"), roleController.getAllRoles);
router.get("/:id", checkPermission("roles:read"), roleController.getRoleById);

router.put(
  "/:id",
  checkPermission("roles:manage"),
  updateRoleValidators,
  handleValidation,
  roleController.updateRole
);

router.delete(
  "/:id",
  checkPermission("roles:manage"),
  roleController.deleteRole
);

router.post(
  "/:id/permissions",
  checkPermission("roles:manage"),
  roleController.addPermissionToRole
);

router.delete(
  "/:id/permissions/:permissionId",
  checkPermission("roles:manage"),
  roleController.removePermissionFromRole
);

module.exports = router;
