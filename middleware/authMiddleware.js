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
      .then(user => {
        if (!user) {
          return res.status(401).json({
            success: false,
            error: "L'usuari ja no existeix",
          });
        }
        req.user = user;
        next();
      })
      .catch(err => {
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
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "No tens permisos per accedir a aquest recurs",
      });
    }
    next();
  };
};

