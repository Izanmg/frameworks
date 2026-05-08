// services/jwtService.js
// Generació i verificació de tokens JWT (Access + Refresh) - T9

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const jwtConfig = require("../config/jwt");

/**
 * Genera un Access Token (durada curta, conté permisos)
 * @param {Object} payload { userId, email, role, permissions }
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
    jwtid: uuidv4(),
  });
}

/**
 * Genera un Refresh Token (durada llarga, només per renovar)
 * @param {String|Object} userId
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId: String(userId), tokenType: "refresh" },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
      jwtid: uuidv4(),
    }
  );
}

/** Verifica un Access Token. Llença error si és invàlid o ha expirat. */
function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

/** Verifica un Refresh Token. */
function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, jwtConfig.refreshSecret);
  if (decoded.tokenType !== "refresh") {
    throw new Error("Token no és de tipus refresh");
  }
  return decoded;
}

/** Decodifica sense verificar (per a inspecció / blacklist) */
function decodeToken(token) {
  return jwt.decode(token);
}

/** Retorna la data d'expiració d'un token (Date) */
function getExpirationDate(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getExpirationDate,
  accessExpiresInSeconds: jwtConfig.accessExpiresInSeconds,
  refreshExpiresInSeconds: jwtConfig.refreshExpiresInSeconds,
};
