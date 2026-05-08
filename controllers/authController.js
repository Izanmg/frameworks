// controllers/authController.js
// Endpoints d'autenticació (T9): register, login, refresh, logout, forgot/reset password

const authService = require("../services/authService");
const permissionService = require("../services/permissionService");

function extractAccessToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.split(" ")[1] : null;
}

exports.register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body, req);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body, req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const data = await authService.refresh(refreshToken, req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const accessToken = extractAccessToken(req);
    const { refreshToken } = req.body || {};
    await authService.logout(accessToken, refreshToken, req.user._id, req);
    req.audit = req.audit || {};
    req.audit.action = "auth:logout";
    return res
      .status(200)
      .json({ success: true, message: "Logout correcte" });
  } catch (err) {
    return next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await authService.forgotPassword(email, req);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const data = await authService.resetPassword(token, newPassword, req);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return next(err);
  }
};

exports.me = async (req, res) => {
  const permissions = await permissionService.getEffectivePermissionNames(
    req.user._id
  );
  return res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.userRole,
      permissions,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    },
  });
};
