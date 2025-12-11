// routes/uploadRoutes.js
// 🔹 Rutes per a la pujada d'imatges

const express = require("express");
const router = express.Router();

const uploadLocal = require("../middleware/uploadLocal");
const uploadCloud = require("../middleware/uploadCloud");
const {
  uploadLocal: uploadLocalController,
  uploadCloud: uploadCloudController,
} = require("../controllers/uploadController");

// POST /api/upload/local
router.post("/local", uploadLocal.single("image"), uploadLocalController);

// POST /api/upload/cloud
router.post("/cloud", uploadCloud.single("image"), uploadCloudController);

module.exports = router;
