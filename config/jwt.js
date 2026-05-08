// config/jwt.js
// Configuració centralitzada del JWT (Access + Refresh) - T9

require("dotenv").config();

module.exports = {
  accessSecret:
    process.env.JWT_ACCESS_SECRET || "fallback_access_secret_dev_only_change_me",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret_dev_only_change_me",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  // Durada en segons (per a l'API). 15m = 900s
  accessExpiresInSeconds: 15 * 60,
  refreshExpiresInSeconds: 7 * 24 * 60 * 60,
};
