// app.js
// Configuració principal d'Express (T9):
// CORS, Helmet, JSON parser, rate limiting global, rutes i error handler.

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const seedPermissions = require("./utils/seedPermissions");
const seedRoles = require("./utils/seedRoles");
const seedAdmin = require("./utils/seedAdmin");

const rateLimiter = require("./middleware/rateLimiter");
const { protect } = require("./middleware/authMiddleware");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const delegationRoutes = require("./routes/delegationRoutes");
const auditRoutes = require("./routes/auditRoutes");
const taskRoutes = require("./routes/taskRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// Confiem en el reverse proxy (X-Forwarded-For) per obtenir IPs reals
app.set("trust proxy", 1);

// Seguretat HTTP
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(","),
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Estàtics (imatges)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Executar seeds en arrencar (idempotent)
seedPermissions()
  .then(() => seedRoles())
  .then(() => seedAdmin())
  .catch((err) => console.error("⚠️ Error executant seeds:", err.message));

// Rate limiting global per a tot /api
// Usuaris autenticats: límit per rol; anònims: límit per IP.
app.use(
  "/api",
  // Intentem identificar l'usuari sense bloquejar si no n'hi ha (per /login, /register).
  (req, _res, next) => {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return next();
    return protect(req, _res, (err) => {
      // Si protect falla aquí, igualment continuem (la ruta concreta el tornarà a aplicar)
      next();
    });
  },
  rateLimiter()
);

// Ruta arrel
app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Gestor de Tasques API",
    version: "9.0.0",
    description:
      "JWT avançat + Jerarquia de rols + Delegació + Auditoria + Rate limiting (T9)",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      roles: "/api/roles",
      permissions: "/api/permissions",
      delegations: "/api/delegations",
      audit: "/api/audit",
      tasks: "/api/tasks",
    },
  });
});

// Healthcheck
app.get("/health", (_req, res) =>
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() })
);

// Rutes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/delegations", delegationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/upload", uploadRoutes);

// Documentació Swagger (opcional)
try {
  const swaggerUi = require("swagger-ui-express");
  const swaggerDoc = require("./config/swagger");
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch (err) {
  // Swagger no és imprescindible; només avisem.
}

// 404
app.use(notFoundHandler);

// Error handler centralitzat (sempre últim)
app.use(errorHandler);

module.exports = app;
