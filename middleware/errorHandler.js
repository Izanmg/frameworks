// middleware/errorHandler.js
// Gestor d'errors centralitzat (T9)

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: `Ruta no trobada: ${req.originalUrl}`,
    code: "NOT_FOUND",
  });
}

function errorHandler(err, req, res, _next) {
  console.error("❌ Error:", err.message);
  if (process.env.NODE_ENV !== "production") console.error(err.stack);

  // Errors propis (AuthError, DelegationError...)
  if (err.status && err.code) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Errors de validació de Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "Error de validació",
      code: "VALIDATION_ERROR",
      details: messages,
    });
  }

  // CastError (ID invàlid)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: `${err.path} no és vàlid: ${err.value}`,
      code: "INVALID_ID",
    });
  }

  // Duplicació (codi 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "camp";
    return res.status(400).json({
      success: false,
      error: `Valor duplicat per al camp '${field}'`,
      code: "DUPLICATE",
    });
  }

  // Errors JWT
  if (err.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json({ success: false, error: "Token invàlid", code: "TOKEN_INVALID" });
  }
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ success: false, error: "Token expirat", code: "TOKEN_EXPIRED" });
  }

  // Per defecte
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "Error intern del servidor",
    code: err.code || "INTERNAL_ERROR",
  });
}

module.exports = { notFoundHandler, errorHandler };
