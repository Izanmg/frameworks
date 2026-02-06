const Permission = require("../models/Permission");
const Role = require("../models/Role");

function formatPermission(permission) {
  return {
    id: permission._id,
    name: permission.name,
    description: permission.description,
    category: permission.category,
    createdAt: permission.createdAt,
  };
}

exports.createPermission = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const existing = await Permission.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Ja existeix un permís amb aquest nom",
      });
    }

    const permission = await Permission.create({
      name,
      description,
      category,
      isSystemPermission: false,
    });

    req.audit.resourceType = "permission";
    req.audit.resource = permission._id.toString();
    req.audit.changes = { created: true, name: permission.name };

    return res.status(201).json({
      success: true,
      message: "Permís creat correctament",
      data: formatPermission(permission),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(formatPermission(perm));
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.getPermissionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const permissions = await Permission.find({ category }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: permissions.map(formatPermission),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Permission.distinct("category");
    return res.status(200).json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const permission = await Permission.findById(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        error: "Permís no trobat",
      });
    }

    const before = permission.description;

    if (description) {
      permission.description = description;
    }

    await permission.save();

    req.audit.resourceType = "permission";
    req.audit.resource = permission._id.toString();
    if (before !== permission.description) {
      req.audit.changes = {
        description: `${before} -> ${permission.description}`,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Permís actualitzat correctament",
      data: formatPermission(permission),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await Permission.findById(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: "Permís no trobat",
      });
    }

    if (permission.isSystemPermission) {
      return res.status(400).json({
        success: false,
        error: "No es poden eliminar permisos del sistema",
      });
    }

    await Role.updateMany(
      { permissions: permission._id },
      { $pull: { permissions: permission._id } }
    );

    await permission.deleteOne();

    req.audit.resourceType = "permission";
    req.audit.resource = id;
    req.audit.changes = { deleted: true, name: permission.name };

    return res.status(200).json({
      success: true,
      message: "Permís eliminat correctament",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};
