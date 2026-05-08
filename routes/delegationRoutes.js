// routes/delegationRoutes.js
// Delegació temporal de permisos (T9)

const express = require("express");
const router = express.Router();

const delegationController = require("../controllers/delegationController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

router.use(protect, auditMiddleware);

router.get(
  "/",
  checkPermission("delegations:read"),
  delegationController.list
);
router.get(
  "/user/:userId",
  checkPermission("delegations:read"),
  delegationController.byUser
);
router.get(
  "/:id",
  checkPermission("delegations:read"),
  delegationController.getById
);

router.post(
  "/",
  checkPermission("permission:delegate"),
  delegationController.create
);
router.put(
  "/:id",
  checkPermission("permission:delegate"),
  delegationController.update
);
router.delete(
  "/:id",
  checkPermission("permission:delegate"),
  delegationController.revoke
);

module.exports = router;
