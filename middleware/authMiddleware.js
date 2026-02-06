const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_para_desarrollo";

// Middleware per verificar el token JWT
exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No estàs autoritzat per accedir a aquesta ruta",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    User.findById(decoded.id)
      .populate("roles")
      .then(async (user) => {
        if (!user) {
          return res.status(401).json({
            success: false,
            error: "L'usuari ja no existeix",
          });
        }
        req.user = user;
        req.userRoles = (user.roles || []).map((role) => role.name);
        next();
      })
      .catch(() => {
        res.status(500).json({ success: false, error: "Error de servidor" });
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token no vàlid",
    });
  }
};

// Middleware per restringir l'accés segons el rol
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRoles = req.userRoles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: "No tens permisos per accedir a aquest recurs",
      });
    }
    next();
  };
};
