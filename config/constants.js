// config/constants.js
// Constants globals del sistema (T9)

module.exports = {
  // Nivells de la jerarquia de rols (Level 5 = més alt, Level 1 = més baix)
  ROLE_LEVELS: {
    SUPER_ADMIN: 5,
    ADMIN: 4,
    MANAGER: 3,
    USER: 2,
    VIEWER: 1,
  },

  // Límits de rate limiting per rol (peticions/minut)
  RATE_LIMITS: {
    super_admin: 1000,
    admin: 500,
    manager: 200,
    user: 100,
    viewer: 50,
    anonymous: 30,
  },

  // Estats de delegació
  DELEGATION_STATUS: {
    ACTIVE: "active",
    EXPIRED: "expired",
    REVOKED: "revoked",
  },

  // Tipus de tokens
  TOKEN_TYPES: {
    ACCESS: "access",
    REFRESH: "refresh",
    RESET: "reset",
  },

  // Codis d'error de l'API
  ERROR_CODES: {
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_INVALID: "TOKEN_INVALID",
    TOKEN_REVOKED: "TOKEN_REVOKED",
    PERMISSION_DENIED: "PERMISSION_DENIED",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    DUPLICATE: "DUPLICATE",
    HIERARCHY_INVALID: "HIERARCHY_INVALID",
  },
};
