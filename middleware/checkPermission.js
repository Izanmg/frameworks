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
        error: "No estas autenticat",
      });
    }

    req.audit = req.audit || {};
    req.audit.action = requiredPermission;

    try {
      const hasPermission = await req.user.hasPermission(requiredPermission);
      if (!hasPermission) {
        req.audit.resource = resolveResource(req);
        req.audit.resourceType = resolveResourceType(req);
        req.audit.errorMessage = "Permission denied";
        return res.status(403).json({
          success: false,
          error: "No tens perm�s per fer aquesta acci�",
        });
      }
      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Error de servidor",
      });
    }
  };
};

module.exports = checkPermission;
