// config/swagger.js
// Configuració mínima de Swagger / OpenAPI (T9 - opcional)

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gestor de Tasques - API T9",
      version: "9.0.0",
      description:
        "API REST amb JWT avançat (Access + Refresh), jerarquia de rols, delegació de permisos, auditoria avançada i rate limiting per rol.",
      contact: { name: "Izan Mendoza" },
    },
    servers: [
      { url: "http://localhost:3000", description: "Desenvolupament local" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Autenticació i recuperació de contrasenya" },
      { name: "Users", description: "Gestió d'usuaris" },
      { name: "Roles", description: "Rols jeràrquics" },
      { name: "Permissions", description: "Permisos granulars" },
      { name: "Delegations", description: "Delegació temporal de permisos" },
      { name: "Audit", description: "Auditoria avançada" },
      { name: "Tasks", description: "Gestor de tasques (T6)" },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

module.exports = swaggerJsdoc(options);
