// utils/seedRoles.js
// Sembra els rols jeràrquics del sistema (T9):
//   SUPER_ADMIN (5) > ADMIN (4) > MANAGER (3) > USER (2) > VIEWER (1)

const Role = require("../models/Role");
const Permission = require("../models/Permission");
const User = require("../models/User");

async function seedRoles() {
  const permissions = await Permission.find();
  const byName = new Map(permissions.map((p) => [p.name, p._id]));
  const pick = (...names) => names.map((n) => byName.get(n)).filter(Boolean);

  // Es defineixen els rols sense parentRole; després enllacem la jerarquia.
  const roleDefs = [
    {
      name: "viewer",
      level: 1,
      description: "Només lectura",
      permissions: pick("tasks:read", "tasks:read_own"),
      isSystemRole: true,
      parent: null,
    },
    {
      name: "user",
      level: 2,
      description: "Usuari estàndard",
      permissions: pick("tasks:create", "tasks:update_own"),
      isSystemRole: true,
      parent: "viewer",
    },
    {
      name: "manager",
      level: 3,
      description: "Manager de projectes",
      permissions: pick(
        "tasks:assign",
        "tasks:review",
        "tasks:update",
        "tasks:delete",
        "users:view",
        "users:read",
        "delegations:read",
        "permission:delegate"
      ),
      isSystemRole: true,
      parent: "user",
    },
    {
      name: "admin",
      level: 4,
      description: "Administrador del sistema",
      permissions: pick(
        "users:manage",
        "roles:manage",
        "roles:read",
        "permissions:manage",
        "permissions:read",
        "audit:view",
        "audit:read",
        "audit:export",
        "reports:view",
        "reports:export"
      ),
      isSystemRole: true,
      parent: "manager",
    },
    {
      name: "super_admin",
      level: 5,
      description: "Super administrador (control total)",
      permissions: pick("system:configure", "system:backup"),
      isSystemRole: true,
      parent: "admin",
    },
  ];

  // Pas 1: crear/actualitzar tots els rols sense parentRole
  for (const def of roleDefs) {
    await Role.findOneAndUpdate(
      { name: def.name },
      {
        $set: {
          level: def.level,
          description: def.description,
          permissions: def.permissions,
          isSystemRole: def.isSystemRole,
          isActive: true,
        },
        $setOnInsert: { name: def.name, createdAt: new Date() },
      },
      { upsert: true, new: true }
    );
  }

  // Pas 2: enllaçar parentRole
  const allRoles = await Role.find();
  const idByName = new Map(allRoles.map((r) => [r.name, r._id]));

  for (const def of roleDefs) {
    if (!def.parent) continue;
    const parentId = idByName.get(def.parent);
    if (!parentId) continue;
    await Role.updateOne(
      { name: def.name },
      { $set: { parentRole: parentId } }
    );
  }

  // Pas 3: assignar rol per defecte als usuaris sense rol
  const defaultRole = await Role.findOne({ name: "user" });
  if (defaultRole) {
    await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { roles: { $size: 0 } },
        ],
      },
      { $set: { role: defaultRole._id, roles: [defaultRole._id] } }
    );
  }
}

module.exports = seedRoles;
