// app.js
// 🔹 Configuració principal d'Express: middleware i rutes

require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();

// Middleware per poder llegir JSON al body de les peticions
app.use(express.json());

// Servir imatges pujades localment
// Exemple: http://localhost:3000/uploads/fitxer.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Importem les rutes de tasques i d'upload
const taskRoutes = require("./routes/taskRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Ruta bàsica per comprovar que el servidor funciona
app.get("/", (req, res) => {
  res.json({ missatge: "API de Gestor de Tasques activa ✅" });
});

// Muntam les rutes
// Tasques: /api/tasks...
app.use("/api", taskRoutes);

// Upload: /api/upload/local, /api/upload/cloud
app.use("/api/upload", uploadRoutes);

// Ruta 404 (ha d'anar al final)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no trobada: ${req.originalUrl}`,
  });
});

module.exports = app;
