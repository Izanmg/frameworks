const User = require("../models/User");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_para_desarrollo";
const JWT_EXPIRES_IN = "24h";

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function buildAuthResponse(user) {
  const roles = await user.getRoleNames();
  const permissions = await user.getEffectivePermissions();
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles,
    permissions,
    createdAt: user.createdAt,
  };
}

// 1?? Registre d'usuari
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "L'email ja està registrat",
      });
    }

    const defaultRole = await Role.findOne({ name: "user" });
    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        error: "Rol per defecte no trobat. Executa els seeds.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      roles: [defaultRole._id],
    });

    const token = signToken(user._id);
    const data = await buildAuthResponse(user);

    return res.status(201).json({
      success: true,
      token,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// 2?? Inici de sessió
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Cal proporcionar email i contrasenya",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Credencials incorrectes",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Credencials incorrectes",
      });
    }

    const token = signToken(user._id);
    const data = await buildAuthResponse(user);

    return res.status(200).json({
      success: true,
      token,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error en el servidor",
    });
  }
};

// 3?? Obtenir perfil (Me)
exports.getMe = async (req, res) => {
  const data = await buildAuthResponse(req.user);
  return res.status(200).json({
    success: true,
    data,
  });
};

// 4?? Actualitzar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    const data = await buildAuthResponse(user);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "L'email ja està en ús",
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// 5?? Canviar contrasenya
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Cal proporcionar la contrasenya actual i la nova",
      });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "La contrasenya actual és incorrecta",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Contrasenya actualitzada correctament",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// 6?? Comprovar permís
exports.checkPermission = async (req, res) => {
  const { permission } = req.body;
  if (!permission) {
    return res.status(400).json({
      success: false,
      hasPermission: false,
      message: "Has d'indicar un permís",
    });
  }

  const hasPermission = await req.user.hasPermission(permission);

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      hasPermission: false,
      message: "No tens permís per fer aquesta acció",
    });
  }

  return res.status(200).json({
    success: true,
    hasPermission: true,
    message: "Tens permís per fer aquesta acció",
  });
};

// 7?? Obtenir tots els usuaris (Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("roles");
    const data = await Promise.all(
      users.map(async (user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        roles: (user.roles || []).map((role) => role.name),
        createdAt: user.createdAt,
      }))
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error de servidor" });
  }
};

// 8?? Eliminar usuari (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuari no trobat" });
    }

    req.audit.resourceType = "user";
    req.audit.resource = user._id.toString();
    req.audit.changes = { deleted: true, email: user.email };

    return res.status(200).json({ success: true, data: { message: "Usuari eliminat" } });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error de servidor" });
  }
};

// 9?? Assignar rol a usuari
exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuari no trobat" });
    }

    const role = await Role.findById(roleId).populate("permissions");
    if (!role) {
      return res.status(404).json({ success: false, error: "Rol no trobat" });
    }

    await user.addRole(role._id);
    await user.populate({ path: "roles", populate: { path: "permissions" } });

    const permissions = await user.getEffectivePermissions();

    req.audit.resourceType = "user";
    req.audit.resource = user._id.toString();
    req.audit.changes = { roleAdded: role.name };

    return res.status(200).json({
      success: true,
      message: "Rol assignat correctament",
      data: {
        userId: user._id,
        roles: user.roles.map((r) => ({
          id: r._id,
          name: r.name,
          permissions: (r.permissions || []).map((p) => p.name),
        })),
        permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error de servidor" });
  }
};

// ?? Eliminar rol d'un usuari
exports.removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    const user = await User.findById(userId).populate("roles");
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuari no trobat" });
    }

    const hasRole = user.roles.some((role) => role._id.toString() === roleId);
    if (!hasRole) {
      return res.status(404).json({ success: false, error: "Rol no assignat" });
    }

    if (user.roles.length <= 1) {
      return res.status(400).json({
        success: false,
        error: "No es pot deixar l'usuari sense rol",
      });
    }

    const role = user.roles.find((r) => r._id.toString() === roleId);

    await user.removeRole(roleId);
    await user.populate({ path: "roles", populate: { path: "permissions" } });

    const permissions = await user.getEffectivePermissions();

    req.audit.resourceType = "user";
    req.audit.resource = user._id.toString();
    req.audit.changes = { roleRemoved: role ? role.name : roleId };

    return res.status(200).json({
      success: true,
      message: "Rol eliminat correctament",
      data: {
        userId: user._id,
        roles: user.roles.map((r) => ({
          id: r._id,
          name: r.name,
          permissions: (r.permissions || []).map((p) => p.name),
        })),
        permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error de servidor" });
  }
};

// 1??1?? Obtenir permisos efectius d'un usuari
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: "roles",
      populate: { path: "permissions" },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Usuari no trobat" });
    }

    const permissions = await user.getEffectivePermissions();

    req.audit.resourceType = "user";
    req.audit.resource = user._id.toString();

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error de servidor" });
  }
};

// 1??2?? (Deprecated) Canviar rol d'usuari
exports.changeUserRole = async (req, res) => {
  try {
    const { roleId } = req.body;
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({ success: false, error: "Rol no vàlid" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuari no trobat" });
    }

    user.roles = [role._id];
    await user.save();

    return res.status(200).json({ success: true, data: { userId: user._id, role: role.name } });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error de servidor" });
  }
};
