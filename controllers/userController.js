// controllers/userController.js
// CRUD d'usuaris (T9)

const User = require("../models/User");
const Role = require("../models/Role");
const permissionService = require("../services/permissionService");

function formatUser(user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const rx = new RegExp(req.query.search, "i");
      filter.$or = [
        { email: rx },
        { firstName: rx },
        { lastName: rx },
      ];
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .populate("role", "name level")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items.map(formatUser),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "role",
      "name level description"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuari no trobat" });
    }
    req.audit.resourceType = "user";
    req.audit.resource = String(user._id);
    return res.json({ success: true, data: formatUser(user) });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuari no trobat" });
    }

    const allowed = ["firstName", "lastName", "isActive"];
    const changes = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined && req.body[k] !== user[k]) {
        changes[k] = { old: user[k], new: req.body[k] };
        user[k] = req.body[k];
      }
    }

    if (req.body.role) {
      const role = await Role.findById(req.body.role);
      if (!role) {
        return res
          .status(400)
          .json({ success: false, error: "Rol no trobat" });
      }
      changes.role = { old: String(user.role), new: String(role._id) };
      user.role = role._id;
      user.roles = [role._id];
    }

    await user.save();

    req.audit.resourceType = "user";
    req.audit.resource = String(user._id);
    req.audit.changes = changes;

    return res.json({
      success: true,
      message: "Usuari actualitzat",
      data: formatUser(user),
    });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuari no trobat" });
    }
    if (String(user._id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, error: "No pots eliminar el teu propi compte" });
    }
    await user.deleteOne();

    req.audit.resourceType = "user";
    req.audit.resource = String(user._id);
    req.audit.changes = { deleted: true, email: user.email };

    return res.json({ success: true, message: "Usuari eliminat" });
  } catch (err) {
    return next(err);
  }
};

exports.getPermissions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuari no trobat" });
    }
    const perms = await permissionService.getEffectivePermissions(user._id);
    req.audit.resourceType = "user";
    req.audit.resource = String(user._id);
    return res.json({
      success: true,
      data: {
        userId: user._id,
        permissions: perms.map((p) => ({
          id: p._id,
          name: p.name,
          description: p.description,
          category: p.category,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};
