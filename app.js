// app.js
// ?? Configuració principal d'Express: middleware i rutes

require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();

const seedPermissions = require("./utils/seedPermissions");
const seedRoles = require("./utils/seedRoles");

// Middleware per poder llegir JSON al body de les peticions
app.use(express.json());

// Servir imatges pujades localment
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Importar rutes
const taskRoutes = require("./routes/taskRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const auditRoutes = require("./routes/auditRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Executar seeds al iniciar
seedPermissions()
  .then(() => seedRoles())
  .catch((err) => console.error("Error executant seeds:", err.message));

// Ruta bàsica per comprovar que el servidor funciona
app.get("/", (req, res) => {
  res.json({ missatge: "API de Gestor de Tasques amb RBAC activa" });
});

// Muntam les rutes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/upload", uploadRoutes);

// Rutes d'administració
app.use("/api/admin/roles", roleRoutes);
app.use("/api/admin/permissions", permissionRoutes);
app.use("/api/admin/audit-logs", auditRoutes);
app.use("/api/admin", adminRoutes);

// Ruta 404 (ha d'anar al final)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no trobada: ${req.originalUrl}`,
  });
});

module.exports = app;
