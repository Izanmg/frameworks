const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

router.use(protect, auditMiddleware);

router.get("/stats", checkPermission("audit:read"), auditController.getAuditStats);
router.get(
  "/user/:userId",
  checkPermission("audit:read"),
  auditController.getUserAuditLogs
);
router.get(
  "/:id",
  checkPermission("audit:read"),
  auditController.getAuditLogById
);
router.get("/", checkPermission("audit:read"), auditController.getAuditLogs);

module.exports = router;
