const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

const tempDir = path.join(os.tmpdir(), "task-manager-uploads");

// 🔹 Crear carpeta si no existe
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Límits 5MB
const MAX_SIZE = 5 * 1024 * 1024;

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);

  if (extValid && mimeValid) cb(null, true);
  else cb(new Error("Només s'accepten arxius d'imatge"));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const uploadCloud = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = uploadCloud;
