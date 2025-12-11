// middleware/uploadLocal.js
// 🔹 Configuració de Multer per pujar imatges localment (carpeta /uploads)

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ens assegurem que la carpeta uploads existeix
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Límits: 5MB
const MAX_SIZE = 5 * 1024 * 1024;

// Filtre de fitxers: només imatges
function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Només s'accepten arxius d'imatge (jpg, png, gif, webp)"));
  }
}

// Emmagatzematge a disc
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const uploadLocal = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = uploadLocal;
