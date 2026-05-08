// controllers/roleController.js
// CRUD i jerarquia de rols (T9)

const mongoose = require("mongoose");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const User = require("../models/User");
const permissionService = require("../services/permissionService");

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function resolvePermissionIds(input) {
  if (!input || !Array.isArray(input)) return [];
  const ids = new Set();
  const names = new Set();
  for (const p of input) {
    if (typeof p !== "string") continue;
    if (isObjectId(p)) ids.add(p);
    else names.add(p.trim());
  }
  const found = [
    ...(ids.size
      ? await Permission.find({ _id: { $in: [...ids] } })
      : []),
    ...(names.size
      ? await Permission.find({ name: { $in: [...names] } })
      : []),
  ];
  const uniqueIds = [...new Set(found.map((p) => p._id.toString()))];
  if (uniqueIds.length !== input.length) return null;
  return uniqueIds;
}

function formatRole(role) {
  return {
    id: role._id,
    name: role.name,
    level: role.level,
    parentRole: role.parentRole,
    description: role.description,
    isActive: role.isActive,
    isSystemRole: role.isSystemRole,
    permissions: (role.permissions || []).map((p) =>
      typeof p === "object" && p.name
        ? { id: p._id, name: p.name, description: p.description }
        : p
    ),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

exports.create = async (req, res, next) => {
  try {
    const { name, level, parentRole, description, permissions } = req.body;

    const existing = await Role.findOne({ name: String(name).toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Ja existeix un rol amb aquest nom",
      });
    }

    if (parentRole) {
      const parent = await Role.findById(parentRole);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: "parentRole no trobat",
        });
      }
      if (parent.level <= level) {
        return res.status(400).json({
          success: false,
          error: "El level del rol pare ha de ser superior al fill",
          code: "HIERARCHY_INVALID",
        });
      }
    }

    const permIds = permissions
      ? await resolvePermissionIds(permissions)
      : [];
    if (permissions && !permIds) {
      return res.status(400).json({
        success: false,
        error: "Alguns permisos no existeixen",
      });
    }

    const role = await Role.create({
      name: String(name).toLowerCase(),
      level,
      parentRole: parentRole || null,
      description: description || "",
      permissions: permIds,
    });

    await role.populate("permissions");

    req.audit.resourceType = "role";
    req.audit.resource = String(role._id);
    req.audit.changes = { created: true, name: role.name, level: role.level };

    return res.status(201).json({
      success: true,
      message: "Rol creat correctament",
      data: formatRole(role),
    });
  } catch (err) {
    return next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const roles = await Role.find()
      .populate("permissions")
      .populate("parentRole", "name level")
      .sort({ level: -1, name: 1 });
    return res.json({ success: true, data: roles.map(formatRole) });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate("permissions")
      .populate("parentRole", "name level");
    if (!role)
      return res.status(404).json({ success: false, error: "Rol no trobat" });

    req.audit.resourceType = "role";
    req.audit.resource = String(role._id);

    return res.json({ success: true, data: formatRole(role) });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role)
      return res.status(404).json({ success: false, error: "Rol no trobat" });

    if (role.isSystemRole && req.body.name && req.body.name !== role.name) {
      return res.status(400).json({
        success: false,
        error: "No es poden renombrar rols del sistema",
      });
    }

    const before = { ...role.toObject() };

    if (req.body.name) role.name = String(req.body.name).toLowerCase();
    if (req.body.description !== undefined)
      role.description = req.body.description;
    if (req.body.level !== undefined) role.level = req.body.level;
    if (req.body.isActive !== undefined) role.isActive = req.body.isActive;

    if (req.body.parentRole !== undefined) {
      if (req.body.parentRole === null) {
        role.parentRole = null;
      } else {
        const cycle = await permissionService.wouldCreateCycle(
          role._id,
          req.body.parentRole
        );
        if (cycle) {
          return res.status(400).json({
            success: false,
            error: "La jerarquia crearia un cicle",
            code: "HIERARCHY_INVALID",
          });
        }
        role.parentRole = req.body.parentRole;
      }
    }

    if (req.body.permissions) {
      const permIds = await resolvePermissionIds(req.body.permissions);
      if (!permIds) {
        return res.status(400).json({
          success: false,
          error: "Alguns permisos no existeixen",
        });
      }
      role.permissions = permIds;
    }

    await role.save();
    await role.populate("permissions");

    req.audit.resourceType = "role";
    req.audit.resource = String(role._id);
    req.audit.changes = {
      name: { old: before.name, new: role.name },
      level: { old: before.level, new: role.level },
    };

    return res.json({
      success: true,
      message: "Rol actualitzat",
      data: formatRole(role),
    });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role)
      return res.status(404).json({ success: false, error: "Rol no trobat" });

    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: "No es poden eliminar rols del sistema",
      });
    }

    // Comprovar si algun rol té aquest com a pare
    const childCount = await Role.countDocuments({ parentRole: role._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        error: `No es pot eliminar: hi ha ${childCount} rols que el tenen com a pare`,
      });
    }

    // Reassigna usuaris al rol per defecte
    const defaultRole = await Role.findOne({ name: "user" });
    await User.updateMany(
      { role: role._id },
      defaultRole
        ? { $set: { role: defaultRole._id, roles: [defaultRole._id] } }
        : { $unset: { role: "" }, $set: { roles: [] } }
    );

    await role.deleteOne();

    req.audit.resourceType = "role";
    req.audit.resource = String(role._id);
    req.audit.changes = { deleted: true, name: role.name };

    return res.json({ success: true, message: "Rol eliminat" });
  } catch (err) {
    return next(err);
  }
};

exports.getHierarchy = async (req, res, next) => {
  try {
    const chain = await permissionService.getRoleChain(req.params.id);
    if (!chain.length) {
      return res
        .status(404)
        .json({ success: false, error: "Rol no trobat" });
    }
    return res.json({
      success: true,
      data: {
        roleId: req.params.id,
        chain: chain.map((r) => ({
          id: r._id,
          name: r.name,
          level: r.level,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getInheritedPermissions = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role)
      return res.status(404).json({ success: false, error: "Rol no trobat" });

    const own = await Role.findById(role._id).populate("permissions");
    const inherited = role.parentRole
      ? await permissionService.getRoleHierarchyPermissions(role.parentRole)
      : [];

    return res.json({
      success: true,
      data: {
        roleId: role._id,
        own: (own.permissions || []).map((p) => ({
          id: p._id,
          name: p.name,
          description: p.description,
        })),
        inherited: inherited.map((p) => ({
          id: p._id,
          name: p.name,
          description: p.description,
        })),
        all: [...new Set([...(own.permissions || []), ...inherited].map((p) => p.name))],
      },
    });
  } catch (err) {
    return next(err);
  }
};
