// services/auditService.js
// Registra accions a la col·lecció AuditLog (T9 - auditoria avançada)

const AuditLog = require("../models/AuditLog");

async function logAction(
  userId,
  action,
  resource,
  resourceType,
  changes = {},
  status = "success",
  req = null,
  errorMessage = "",
  duration = 0
) {
  try {
    if (!userId) return null;
    return await AuditLog.log(
      userId,
      action,
      resource,
      resourceType,
      status,
      changes,
      req,
      errorMessage,
      duration
    );
  } catch (err) {
    console.error("⚠️ Error registrant auditoria:", err.message);
    return null;
  }
}

module.exports = { logAction };
