// controllers/permissionController.js
// CRUD de permisos (T9)

const Permission = require("../models/Permission");
const Role = require("../models/Role");

function formatPermission(p) {
  return {
    id: p._id,
    name: p.name,
    description: p.description,
    category: p.category,
    isSystemPermission: p.isSystemPermission,
    createdAt: p.createdAt,
  };
}

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const permissions = await Permission.find(filter).sort({
      category: 1,
      name: 1,
    });

    if (req.query.grouped === "true") {
      const grouped = permissions.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(formatPermission(p));
        return acc;
      }, {});
      return res.json({ success: true, data: grouped });
    }

    return res.json({
      success: true,
      data: permissions.map(formatPermission),
    });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await Permission.findById(req.params.id);
    if (!p)
      return res
        .status(404)
        .json({ success: false, error: "Permís no trobat" });

    req.audit.resourceType = "permission";
    req.audit.resource = String(p._id);

    return res.json({ success: true, data: formatPermission(p) });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        error: "name, description i category són obligatoris",
      });
    }

    const existing = await Permission.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Ja existeix un permís amb aquest nom",
        code: "DUPLICATE",
      });
    }

    const permission = await Permission.create({
      name,
      description,
      category,
      isSystemPermission: false,
    });

    req.audit.resourceType = "permission";
    req.audit.resource = String(permission._id);
    req.audit.changes = { created: true, name: permission.name };

    return res.status(201).json({
      success: true,
      message: "Permís creat",
      data: formatPermission(permission),
    });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Permission.findById(req.params.id);
    if (!p)
      return res
        .status(404)
        .json({ success: false, error: "Permís no trobat" });

    const before = p.description;
    if (req.body.description) p.description = req.body.description;
    if (req.body.category) p.category = req.body.category;

    await p.save();

    req.audit.resourceType = "permission";
    req.audit.resource = String(p._id);
    if (before !== p.description) {
      req.audit.changes = { description: { old: before, new: p.description } };
    }

    return res.json({
      success: true,
      message: "Permís actualitzat",
      data: formatPermission(p),
    });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const p = await Permission.findById(req.params.id);
    if (!p)
      return res
        .status(404)
        .json({ success: false, error: "Permís no trobat" });

    if (p.isSystemPermission) {
      return res.status(400).json({
        success: false,
        error: "No es poden eliminar permisos del sistema",
      });
    }

    await Role.updateMany(
      { permissions: p._id },
      { $pull: { permissions: p._id } }
    );
    await p.deleteOne();

    req.audit.resourceType = "permission";
    req.audit.resource = String(p._id);
    req.audit.changes = { deleted: true, name: p.name };

    return res.json({ success: true, message: "Permís eliminat" });
  } catch (err) {
    return next(err);
  }
};
