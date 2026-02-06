const Role = require("../models/Role");
const Permission = require("../models/Permission");
const User = require("../models/User");

async function seedRoles() {
  const permissions = await Permission.find();
  const byName = new Map(permissions.map((perm) => [perm.name, perm._id]));

  const roleDefinitions = [
    {
      name: "admin",
      description: "Administrador del sistema",
      permissions: permissions.map((perm) => perm._id),
      isSystemRole: true,
    },
    {
      name: "user",
      description: "Usuari estàndard",
      permissions: [
        byName.get("tasks:create"),
        byName.get("tasks:read"),
        byName.get("tasks:update"),
        byName.get("tasks:delete"),
      ].filter(Boolean),
      isSystemRole: true,
    },
    {
      name: "viewer",
      description: "Només lectura",
      permissions: [byName.get("tasks:read")].filter(Boolean),
      isSystemRole: false,
    },
    {
      name: "editor",
      description: "Pot crear i editar tasques",
      permissions: [
        byName.get("tasks:create"),
        byName.get("tasks:read"),
        byName.get("tasks:update"),
        byName.get("tasks:delete"),
      ].filter(Boolean),
      isSystemRole: false,
    },
  ];

  for (const role of roleDefinitions) {
    await Role.findOneAndUpdate(
      { name: role.name },
      {
        $set: {
          description: role.description,
          permissions: role.permissions,
          isSystemRole: role.isSystemRole,
        },
        $setOnInsert: {
          name: role.name,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  const defaultRole = await Role.findOne({ name: "user" });
  if (defaultRole) {
    await User.updateMany(
      { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] },
      { $set: { roles: [defaultRole._id] } }
    );
  }
}

module.exports = seedRoles;
