// services/delegationService.js
// Lògica de delegació temporal de permisos (T9)

const DelegatedPermission = require("../models/DelegatedPermission");
const Permission = require("../models/Permission");
const User = require("../models/User");
const auditService = require("./auditService");

class DelegationError extends Error {
  constructor(message, status = 400, code = "DELEGATION_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Resol una referència de permís (id o name) a un Permission document */
async function resolvePermission(input) {
  if (!input) return null;
  if (/^[0-9a-fA-F]{24}$/.test(String(input))) {
    return Permission.findById(input);
  }
  return Permission.findOne({ name: input });
}

/**
 * Crea una delegació de permís temporal
 * @param {Object} params { fromUserId, toUserId, permission, reason, daysValid }
 */
async function createDelegation(
  { fromUserId, toUserId, permission, reason, daysValid = 5 },
  req
) {
  if (!toUserId || !permission) {
    throw new DelegationError(
      "toUserId i permission són obligatoris",
      400,
      "MISSING_DATA"
    );
  }

  const days = Number(daysValid);
  if (!Number.isFinite(days) || days <= 0) {
    throw new DelegationError(
      "daysValid ha de ser un nombre positiu",
      400,
      "INVALID_DAYS"
    );
  }

  if (String(fromUserId) === String(toUserId)) {
    throw new DelegationError(
      "No pots delegar permisos a tu mateix",
      400,
      "SELF_DELEGATION"
    );
  }

  const targetUser = await User.findById(toUserId);
  if (!targetUser) {
    throw new DelegationError("Usuari destinatari no trobat", 404, "NOT_FOUND");
  }

  const permissionDoc = await resolvePermission(permission);
  if (!permissionDoc) {
    throw new DelegationError("Permís no trobat", 404, "NOT_FOUND");
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const delegation = await DelegatedPermission.create({
    fromUserId,
    toUserId,
    permission: permissionDoc._id,
    reason: reason || "",
    delegatedAt: new Date(),
    expiresAt,
    status: "active",
  });

  await auditService.logAction(
    fromUserId,
    "permission:delegate",
    String(delegation._id),
    "delegation",
    {
      toUserId: String(toUserId),
      permission: permissionDoc.name,
      daysValid: days,
      reason: reason || "",
    },
    "success",
    req
  );

  return delegation.populate(["permission", "fromUserId", "toUserId"]);
}

/** Llista totes les delegacions amb filtres opcionals */
async function listDelegations({ status, fromUserId, toUserId } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (fromUserId) filter.fromUserId = fromUserId;
  if (toUserId) filter.toUserId = toUserId;

  const list = await DelegatedPermission.find(filter)
    .populate("permission")
    .populate("fromUserId", "email firstName lastName")
    .populate("toUserId", "email firstName lastName")
    .sort({ createdAt: -1 });

  // Marca com a expirades les que ho són
  const now = new Date();
  for (const d of list) {
    if (d.status === "active" && d.expiresAt < now) {
      d.status = "expired";
      await d.save();
    }
  }
  return list;
}

async function getDelegationById(id) {
  return DelegatedPermission.findById(id)
    .populate("permission")
    .populate("fromUserId", "email firstName lastName")
    .populate("toUserId", "email firstName lastName");
}

async function revokeDelegation(id, byUserId, req) {
  const d = await DelegatedPermission.findById(id);
  if (!d) {
    throw new DelegationError("Delegació no trobada", 404, "NOT_FOUND");
  }
  if (d.status !== "active") {
    throw new DelegationError(
      "Només es poden revocar delegacions actives",
      400,
      "INVALID_STATUS"
    );
  }
  d.status = "revoked";
  d.revokedAt = new Date();
  await d.save();

  await auditService.logAction(
    byUserId,
    "permission:revoke",
    String(d._id),
    "delegation",
    { reason: "manual revoke" },
    "success",
    req
  );

  return d;
}

async function updateDelegation(id, updates, byUserId, req) {
  const d = await DelegatedPermission.findById(id);
  if (!d) throw new DelegationError("Delegació no trobada", 404, "NOT_FOUND");

  const changes = {};
  if (updates.reason !== undefined && updates.reason !== d.reason) {
    changes.reason = { old: d.reason, new: updates.reason };
    d.reason = updates.reason;
  }
  if (updates.daysValid) {
    const days = Number(updates.daysValid);
    if (!Number.isFinite(days) || days <= 0) {
      throw new DelegationError(
        "daysValid ha de ser un nombre positiu",
        400,
        "INVALID_DAYS"
      );
    }
    const newExp = new Date(d.delegatedAt.getTime() + days * 86400000);
    changes.expiresAt = { old: d.expiresAt, new: newExp };
    d.expiresAt = newExp;
  }
  await d.save();

  await auditService.logAction(
    byUserId,
    "permission:update_delegation",
    String(d._id),
    "delegation",
    changes,
    "success",
    req
  );

  return d.populate(["permission", "fromUserId", "toUserId"]);
}

async function cleanupExpired() {
  const result = await DelegatedPermission.updateMany(
    { status: "active", expiresAt: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
  return result.modifiedCount || 0;
}

module.exports = {
  createDelegation,
  listDelegations,
  getDelegationById,
  revokeDelegation,
  updateDelegation,
  cleanupExpired,
  DelegationError,
};
