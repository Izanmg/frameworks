// controllers/uploadController.js
// 🔹 Lògica de pujada d'imatges (local i Cloudinary)
// IMPORTANT: aquí fem servir PROMESES .then().catch() (sense async/await)

const path = require("path");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// 📤 Pujar imatge localment
exports.uploadLocal = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Cal enviar una imatge al camp 'image'",
    });
  }

  const filename = req.file.filename;
  const relativePath = `/uploads/${filename}`;
  const url = `${req.protocol}://${req.get("host")}${relativePath}`;

  return res.status(201).json({
    success: true,
    message: "Imatge pujada localment",
    image: {
      filename,
      path: relativePath,
      url,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
};

// ☁️ Pujar imatge a Cloudinary
exports.uploadCloud = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Cal enviar una imatge al camp 'image'",
    });
  }

  const filePath = req.file.path;

  cloudinary.uploader
    .upload(filePath, {
      folder: "task-manager/images",
    })
    .then((result) => {
      // Eliminem el fitxer temporal del disc
      fs.unlink(filePath, () => {});

      return res.status(201).json({
        success: true,
        message: "Imatge pujada a Cloudinary",
        image: {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
        },
      });
    })
    .catch((error) => {
      console.error("Error pujant a Cloudinary:", error.message);

      return res.status(500).json({
        success: false,
        message: "Error pujant la imatge a Cloudinary",
      });
    });
};
