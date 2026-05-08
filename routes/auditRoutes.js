// routes/auditRoutes.js
// Endpoints d'auditoria (T9)

const express = require("express");
const router = express.Router();

const auditController = require("../controllers/auditController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

router.use(protect, auditMiddleware);

router.get("/logs", checkPermission("audit:read"), auditController.list);
router.get(
  "/logs/:id",
  checkPermission("audit:read"),
  auditController.getById
);

router.get("/stats", checkPermission("audit:read"), auditController.getStats);
router.get(
  "/stats/user/:userId",
  checkPermission("audit:read"),
  auditController.getStatsByUser
);

router.get(
  "/export",
  checkPermission("audit:read"),
  auditController.exportLogs
);

module.exports = router;
