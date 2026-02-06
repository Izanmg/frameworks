const mongoose = require("mongoose");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const User = require("../models/User");

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function resolvePermissionIds(permissionsInput) {
  if (!permissionsInput || !Array.isArray(permissionsInput)) return [];

  const ids = new Set();
  const names = new Set();

  permissionsInput.forEach((perm) => {
    if (isObjectId(perm)) {
      ids.add(perm);
    } else if (typeof perm === "string") {
      names.add(perm.trim());
    }
  });

  const foundById = ids.size
    ? await Permission.find({ _id: { $in: [...ids] } })
    : [];
  const foundByName = names.size
    ? await Permission.find({ name: { $in: [...names] } })
    : [];

  const all = [...foundById, ...foundByName];
  const uniqueIds = [...new Set(all.map((perm) => perm._id.toString()))];

  if (uniqueIds.length !== permissionsInput.length) {
    return null;
  }

  return uniqueIds;
}

function formatRole(role) {
  return {
    id: role._id,
    name: role.name,
    description: role.description,
    permissions: (role.permissions || []).map((perm) => ({
      id: perm._id,
      name: perm.name,
      description: perm.description,
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Ja existeix un rol amb aquest nom",
      });
    }

    const permissionIds = await resolvePermissionIds(permissions);
    if (!permissionIds) {
      return res.status(400).json({
        success: false,
        error: "Alguns permisos no existeixen",
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions: permissionIds,
      isSystemRole: false,
    });

    await role.populate("permissions");

    req.audit.resourceType = "role";
    req.audit.resource = role._id.toString();
    req.audit.changes = { created: true, name: role.name };

    return res.status(201).json({
      success: true,
      message: "Rol creat correctament",
      data: formatRole(role),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions").sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: roles.map(formatRole),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate("permissions");
    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Rol no trobat",
      });
    }

    req.audit.resourceType = "role";
    req.audit.resource = role._id.toString();

    return res.status(200).json({
      success: true,
      data: formatRole(role),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "ID de rol no vàlid",
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Rol no trobat",
      });
    }

    if (role.isSystemRole && name && name !== role.name) {
      return res.status(400).json({
        success: false,
        error: "No es poden renombrar rols del sistema",
      });
    }

    const before = {
      name: role.name,
      description: role.description,
    };

    if (name) role.name = name;
    if (description) role.description = description;

    if (permissions) {
      const permissionIds = await resolvePermissionIds(permissions);
      if (!permissionIds) {
        return res.status(400).json({
          success: false,
          error: "Alguns permisos no existeixen",
        });
      }
      role.permissions = permissionIds;
    }

    await role.save();
    await role.populate("permissions");

    const changes = {};
    if (before.name !== role.name) {
      changes.name = `${before.name} -> ${role.name}`;
    }
    if (before.description !== role.description) {
      changes.description = `${before.description} -> ${role.description}`;
    }
    if (permissions) {
      changes.permissions = "updated";
    }

    req.audit.resourceType = "role";
    req.audit.resource = role._id.toString();
    req.audit.changes = Object.keys(changes).length ? changes : null;

    return res.status(200).json({
      success: true,
      message: "Rol actualitzat correctament",
      data: formatRole(role),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Rol no trobat",
      });
    }

    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: "No es poden eliminar rols del sistema",
      });
    }

    const defaultRole = await Role.findOne({ name: "user" });

    const usersWithRole = await User.find({ roles: role._id });
    for (const user of usersWithRole) {
      const remainingRoles = user.roles.filter(
        (roleId) => roleId.toString() !== role._id.toString()
      );

      if (remainingRoles.length === 0 && defaultRole) {
        user.roles = [defaultRole._id];
      } else {
        user.roles = remainingRoles;
      }
      await user.save();
    }

    await role.deleteOne();

    req.audit.resourceType = "role";
    req.audit.resource = id;
    req.audit.changes = { deleted: true, name: role.name };

    return res.status(200).json({
      success: true,
      message: "Rol eliminat correctament",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.addPermissionToRole = async (req, res) => {
  try {
    const { id } = req.params;
    const permissionValue = req.body.permissionId || req.body.permission;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Rol no trobat",
      });
    }

    const permissionDoc = isObjectId(permissionValue)
      ? await Permission.findById(permissionValue)
      : await Permission.findOne({ name: permissionValue });

    if (!permissionDoc) {
      return res.status(404).json({
        success: false,
        error: "Permís no trobat",
      });
    }

    await role.addPermission(permissionDoc._id);
    await role.populate("permissions");

    req.audit.resourceType = "role";
    req.audit.resource = role._id.toString();
    req.audit.changes = { permissionAdded: permissionDoc.name };

    return res.status(200).json({
      success: true,
      message: "Permís afegit correctament",
      data: formatRole(role),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.removePermissionFromRole = async (req, res) => {
  try {
    const { id, permissionId } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Rol no trobat",
      });
    }

    const permissionDoc = await Permission.findById(permissionId);

    await role.removePermission(permissionId);
    await role.populate("permissions");

    req.audit.resourceType = "role";
    req.audit.resource = role._id.toString();
    req.audit.changes = {
      permissionRemoved: permissionDoc ? permissionDoc.name : permissionId,
    };

    return res.status(200).json({
      success: true,
      message: "Permís eliminat correctament",
      data: formatRole(role),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
