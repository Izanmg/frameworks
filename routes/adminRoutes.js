const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

router.use(protect, auditMiddleware);

router.get("/users", checkPermission("users:manage"), authController.getUsers);
router.delete("/users/:id", checkPermission("users:manage"), authController.deleteUser);

router.post(
  "/users/:userId/roles",
  checkPermission("users:manage"),
  authController.assignRoleToUser
);

router.delete(
  "/users/:userId/roles/:roleId",
  checkPermission("users:manage"),
  authController.removeRoleFromUser
);

router.get(
  "/users/:userId/permissions",
  checkPermission("users:manage"),
  authController.getUserPermissions
);

module.exports = router;
