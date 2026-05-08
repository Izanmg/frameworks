// middleware/authMiddleware.js
// Verifica access token, comprova blacklist i carrega l'usuari (T9)

const jwtService = require("../services/jwtService");
const TokenBlacklist = require("../models/TokenBlacklist");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token no proporcionat",
        code: "TOKEN_MISSING",
      });
    }

    // Comprovar blacklist
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: "Token revocat",
        code: "TOKEN_REVOKED",
      });
    }

    let decoded;
    try {
      decoded = jwtService.verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token expirat",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        error: "Token invàlid",
        code: "TOKEN_INVALID",
      });
    }

    const user = await User.findById(decoded.userId).populate("role");
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Usuari no vàlid o desactivat",
        code: "USER_INVALID",
      });
    }

    req.token = token;
    req.user = user;
    req.userId = user._id;
    req.userRole = decoded.role || (user.role && user.role.name);
    req.userPermissions = decoded.permissions || [];
    next();
  } catch (err) {
    console.error("authMiddleware:", err);
    return res
      .status(500)
      .json({ success: false, error: "Error del servidor" });
  }
};

/** Restringeix l'accés a determinats rols (per nom). */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res
        .status(401)
        .json({ success: false, error: "No estàs autenticat" });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: "No tens permisos per accedir a aquest recurs",
      });
    }
    next();
  };
};
