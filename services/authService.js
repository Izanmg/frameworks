// services/authService.js
// Lògica d'autenticació: register, login, refresh, logout, forgot/reset password.

const crypto = require("crypto");
const User = require("../models/User");
const Role = require("../models/Role");
const TokenBlacklist = require("../models/TokenBlacklist");
const PasswordReset = require("../models/PasswordReset");
const jwtService = require("./jwtService");
const permissionService = require("./permissionService");
const auditService = require("./auditService");
const emailService = require("./emailService");

class AuthError extends Error {
  constructor(message, status = 400, code = "AUTH_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function buildAccessTokenPayload(user) {
  const role = user.role
    ? await Role.findById(user.role).lean()
    : null;
  const permissionNames = await permissionService.getEffectivePermissionNames(
    user._id
  );
  return {
    userId: String(user._id),
    email: user.email,
    role: role ? role.name : null,
    permissions: permissionNames,
  };
}

/** Registra un nou usuari amb el rol per defecte ("user") */
async function register({ email, password, firstName, lastName }, req) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AuthError("L'email ja està registrat", 400, "DUPLICATE");
  }

  const defaultRole = await Role.findOne({ name: "user" });
  if (!defaultRole) {
    throw new AuthError(
      "Rol per defecte no trobat. Executa el seed.",
      500,
      "SEED_MISSING"
    );
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: defaultRole._id,
    roles: [defaultRole._id],
    isActive: true,
  });

  const payload = await buildAccessTokenPayload(user);
  const accessToken = jwtService.generateAccessToken(payload);
  const refreshToken = jwtService.generateRefreshToken(user._id);

  await auditService.logAction(
    user._id,
    "auth:register",
    String(user._id),
    "user",
    { email },
    "success",
    req
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: jwtService.accessExpiresInSeconds,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: payload.role,
      permissions: payload.permissions,
    },
  };
}

/** Inici de sessió */
async function login({ email, password }, req) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AuthError("Credencials incorrectes", 401, "INVALID_CREDENTIALS");
  }
  if (!user.isActive) {
    throw new AuthError("Compte desactivat", 403, "ACCOUNT_DISABLED");
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    await auditService.logAction(
      user._id,
      "auth:login",
      String(user._id),
      "user",
      { email },
      "error",
      req,
      "Invalid password"
    );
    throw new AuthError("Credencials incorrectes", 401, "INVALID_CREDENTIALS");
  }

  user.lastLogin = new Date();
  await user.save();

  const payload = await buildAccessTokenPayload(user);
  const accessToken = jwtService.generateAccessToken(payload);
  const refreshToken = jwtService.generateRefreshToken(user._id);

  await auditService.logAction(
    user._id,
    "auth:login",
    String(user._id),
    "user",
    { email },
    "success",
    req
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: jwtService.accessExpiresInSeconds,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: payload.role,
      permissions: payload.permissions,
    },
  };
}

/** Renova l'access token a partir d'un refresh token vàlid */
async function refresh(refreshToken, req) {
  if (!refreshToken) {
    throw new AuthError("Refresh token no proporcionat", 400, "MISSING_TOKEN");
  }

  // Comprovar blacklist
  const isBlacklisted = await TokenBlacklist.isBlacklisted(refreshToken);
  if (isBlacklisted) {
    throw new AuthError("Token revocat", 401, "TOKEN_REVOKED");
  }

  let decoded;
  try {
    decoded = jwtService.verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AuthError("Refresh token invàlid", 401, "TOKEN_INVALID");
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new AuthError("Usuari no vàlid", 401, "USER_INVALID");
  }

  const payload = await buildAccessTokenPayload(user);
  const newAccessToken = jwtService.generateAccessToken(payload);

  await auditService.logAction(
    user._id,
    "auth:refresh",
    String(user._id),
    "auth",
    {},
    "success",
    req
  );

  return {
    accessToken: newAccessToken,
    expiresIn: jwtService.accessExpiresInSeconds,
  };
}

/** Logout: afegeix l'access i el refresh token a la blacklist */
async function logout(accessToken, refreshToken, userId, req) {
  const promises = [];

  if (accessToken) {
    const accessExp =
      jwtService.getExpirationDate(accessToken) ||
      new Date(Date.now() + 15 * 60 * 1000);
    promises.push(
      TokenBlacklist.create({
        token: accessToken,
        userId,
        tokenType: "access",
        revokedAt: new Date(),
        expiresAt: accessExp,
      }).catch((e) => {
        if (e.code !== 11000) throw e;
      })
    );
  }

  if (refreshToken) {
    const refreshExp =
      jwtService.getExpirationDate(refreshToken) ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    promises.push(
      TokenBlacklist.create({
        token: refreshToken,
        userId,
        tokenType: "refresh",
        revokedAt: new Date(),
        expiresAt: refreshExp,
      }).catch((e) => {
        if (e.code !== 11000) throw e;
      })
    );
  }

  await Promise.all(promises);

  await auditService.logAction(
    userId,
    "auth:logout",
    String(userId),
    "auth",
    {},
    "success",
    req
  );

  return { message: "Logout correcte" };
}

/** Inicia el procés de recuperació: genera token i l'envia per email */
async function forgotPassword(email, req) {
  const user = await User.findOne({ email });
  // Per seguretat, retornem 200 fins i tot si l'usuari no existeix
  // (no revelar si l'email està registrat)
  if (!user) {
    return { message: "Si l'email existeix, rebràs instruccions per email" };
  }

  // Invalidem reset tokens anteriors
  await PasswordReset.updateMany(
    { userId: user._id, usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const token = crypto.randomBytes(32).toString("hex");
  const expiresInMs = 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + expiresInMs);

  await PasswordReset.create({
    userId: user._id,
    token,
    expiresAt,
  });

  const resetUrl =
    process.env.RESET_PASSWORD_URL || "http://localhost:3000/reset-password";

  await emailService.sendPasswordResetEmail(user.email, resetUrl, token);

  await auditService.logAction(
    user._id,
    "auth:forgot_password",
    String(user._id),
    "user",
    { email },
    "success",
    req
  );

  return {
    message: "Si l'email existeix, rebràs instruccions per email",
    // Només en desenvolupament: retornem el token per facilitar les proves
    ...(process.env.NODE_ENV !== "production" && { devToken: token }),
  };
}

/** Reset de contrasenya amb un token vàlid */
async function resetPassword(token, newPassword, req) {
  if (!token || !newPassword) {
    throw new AuthError(
      "Token i nova contrasenya són obligatoris",
      400,
      "MISSING_DATA"
    );
  }

  const reset = await PasswordReset.findOne({ token });
  if (!reset || !reset.isValid()) {
    throw new AuthError("Token invàlid o expirat", 400, "TOKEN_INVALID");
  }

  const user = await User.findById(reset.userId);
  if (!user) {
    throw new AuthError("Usuari no trobat", 404, "USER_NOT_FOUND");
  }

  user.password = newPassword;
  await user.save();

  reset.usedAt = new Date();
  await reset.save();

  await auditService.logAction(
    user._id,
    "auth:reset_password",
    String(user._id),
    "user",
    {},
    "success",
    req
  );

  return { message: "Contrasenya actualitzada correctament" };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  AuthError,
};
