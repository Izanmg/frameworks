// utils/seedPermissions.js
// Permisos per defecte del sistema (T9)

const Permission = require("../models/Permission");

const defaultPermissions = [
  // Tasks
  { name: "tasks:create", description: "Crear tasques", category: "tasks" },
  { name: "tasks:read", description: "Veure tasques", category: "tasks" },
  { name: "tasks:read_own", description: "Veure les pròpies tasques", category: "tasks" },
  { name: "tasks:update", description: "Editar tasques", category: "tasks" },
  { name: "tasks:update_own", description: "Editar les pròpies tasques", category: "tasks" },
  { name: "tasks:delete", description: "Eliminar tasques", category: "tasks" },
  { name: "tasks:assign", description: "Assignar tasques", category: "tasks" },
  { name: "tasks:review", description: "Revisar tasques", category: "tasks" },
  // Users
  { name: "users:read", description: "Veure usuaris", category: "users" },
  { name: "users:view", description: "Veure detall d'usuaris", category: "users" },
  { name: "users:manage", description: "Gestionar usuaris", category: "users" },
  // Roles
  { name: "roles:read", description: "Veure rols", category: "roles" },
  { name: "roles:manage", description: "Gestionar rols", category: "roles" },
  // Permissions
  { name: "permissions:read", description: "Veure permisos", category: "permissions" },
  { name: "permissions:manage", description: "Gestionar permisos", category: "permissions" },
  // Audit
  { name: "audit:read", description: "Veure auditoria", category: "audit" },
  { name: "audit:view", description: "Veure auditoria avançada", category: "audit" },
  { name: "audit:export", description: "Exportar logs d'auditoria", category: "audit" },
  // Delegations
  { name: "delegations:read", description: "Veure delegacions", category: "delegations" },
  { name: "permission:delegate", description: "Delegar permisos a un altre usuari", category: "delegations" },
  // System
  { name: "system:configure", description: "Configurar el sistema", category: "system" },
  { name: "system:backup", description: "Fer backups del sistema", category: "system" },
  // Reports
  { name: "reports:view", description: "Veure informes", category: "reports" },
  { name: "reports:export", description: "Exportar informes", category: "reports" },
];

async function seedPermissions() {
  for (const perm of defaultPermissions) {
    await Permission.findOneAndUpdate(
      { name: perm.name },
      {
        $set: {
          description: perm.description,
          category: perm.category,
          isSystemPermission: true,
        },
        $setOnInsert: {
          name: perm.name,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
}

module.exports = seedPermissions;
module.exports.defaultPermissions = defaultPermissions;
