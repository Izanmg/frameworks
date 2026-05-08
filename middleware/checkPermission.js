// middleware/checkPermission.js
// Comprova que l'usuari té un permís concret (efectiu = rol jeràrquic + delegacions)

const permissionService = require("../services/permissionService");

function resolveResource(req) {
  if (req.audit && req.audit.resource) return req.audit.resource;
  return (
    req.params.id ||
    req.params.userId ||
    req.params.roleId ||
    req.params.permissionId ||
    ""
  );
}

function resolveResourceType(req) {
  if (req.audit && req.audit.resourceType) return req.audit.resourceType;
  const target = `${req.baseUrl || ""}${req.path || ""}`.toLowerCase();
  if (target.includes("/tasks")) return "task";
  if (target.includes("/roles")) return "role";
  if (target.includes("/permissions")) return "permission";
  if (target.includes("/delegations")) return "delegation";
  if (target.includes("/audit")) return "audit";
  if (target.includes("/users")) return "user";
  if (target.includes("/auth")) return "auth";
  return "";
}

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "No estàs autenticat",
      });
    }

    req.audit = req.audit || {};
    req.audit.action = requiredPermission;

    try {
      // Primer comprovem els permisos del token (ràpid).
      // Si no hi són, recalculem (per cobrir delegacions noves).
      let allowed =
        Array.isArray(req.userPermissions) &&
        req.userPermissions.includes(requiredPermission);

      if (!allowed) {
        allowed = await permissionService.hasPermission(
          req.user._id,
          requiredPermission
        );
      }

      if (!allowed) {
        req.audit.resource = resolveResource(req);
        req.audit.resourceType = resolveResourceType(req);
        req.audit.errorMessage = "Permission denied";
        return res.status(403).json({
          success: false,
          error: "No tens permís per fer aquesta acció",
          code: "PERMISSION_DENIED",
        });
      }
      return next();
    } catch (err) {
      console.error("checkPermission:", err);
      return res
        .status(500)
        .json({ success: false, error: "Error del servidor" });
    }
  };
};

module.exports = checkPermission;
