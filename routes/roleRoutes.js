// routes/roleRoutes.js
// CRUD i jerarquia de rols (T9)

const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");
const handleValidation = require("../middleware/validators/handleValidation");
const {
  createRoleValidators,
  updateRoleValidators,
} = require("../middleware/validators/roleValidators");

router.use(protect, auditMiddleware);

router.get("/", checkPermission("roles:read"), roleController.list);
router.get("/:id", checkPermission("roles:read"), roleController.getById);
router.get(
  "/:id/hierarchy",
  checkPermission("roles:read"),
  roleController.getHierarchy
);
router.get(
  "/:id/permissions",
  checkPermission("roles:read"),
  roleController.getInheritedPermissions
);

router.post(
  "/",
  checkPermission("roles:manage"),
  createRoleValidators,
  handleValidation,
  roleController.create
);

router.put(
  "/:id",
  checkPermission("roles:manage"),
  updateRoleValidators,
  handleValidation,
  roleController.update
);

router.delete(
  "/:id",
  checkPermission("roles:manage"),
  roleController.remove
);

module.exports = router;
