const AuditLog = require("../models/AuditLog");

function inferResourceType(req) {
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

function inferResource(req) {
  if (req.audit && req.audit.resource) return req.audit.resource;
  return (
    req.params.id ||
    req.params.userId ||
    req.params.roleId ||
    req.params.permissionId ||
    ""
  );
}

const auditMiddleware = (req, res, next) => {
  res.on("finish", async () => {
    if (!req.user) return;
    if (!req.audit || !req.audit.action) return;
    if (res.locals.auditLogged) return;

    const status = res.statusCode >= 400 ? "error" : "success";
    const errorMessage =
      req.audit.errorMessage || res.locals.errorMessage || "";

    try {
      await AuditLog.log(
        req.user._id,
        req.audit.action,
        inferResource(req),
        inferResourceType(req),
        status,
        req.audit.changes || null,
        req,
        errorMessage
      );
      res.locals.auditLogged = true;
    } catch (error) {
      console.error("Error registrant auditoria:", error.message);
    }
  });

  req.audit = req.audit || {};

  next();
};

module.exports = auditMiddleware;
