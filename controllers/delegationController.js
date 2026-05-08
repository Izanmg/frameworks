// controllers/delegationController.js
// Gestió de delegacions de permisos (T9)

const delegationService = require("../services/delegationService");
const DelegatedPermission = require("../models/DelegatedPermission");

function formatDelegation(d) {
  return {
    id: d._id,
    fromUser: d.fromUserId
      ? {
          id: d.fromUserId._id || d.fromUserId,
          email: d.fromUserId.email,
          name:
            d.fromUserId.firstName && d.fromUserId.lastName
              ? `${d.fromUserId.firstName} ${d.fromUserId.lastName}`
              : undefined,
        }
      : null,
    toUser: d.toUserId
      ? {
          id: d.toUserId._id || d.toUserId,
          email: d.toUserId.email,
          name:
            d.toUserId.firstName && d.toUserId.lastName
              ? `${d.toUserId.firstName} ${d.toUserId.lastName}`
              : undefined,
        }
      : null,
    permission: d.permission
      ? {
          id: d.permission._id || d.permission,
          name: d.permission.name,
          description: d.permission.description,
        }
      : null,
    reason: d.reason,
    delegatedAt: d.delegatedAt,
    expiresAt: d.expiresAt,
    revokedAt: d.revokedAt,
    status: d.status,
  };
}

exports.list = async (req, res, next) => {
  try {
    const list = await delegationService.listDelegations(req.query || {});
    return res.json({ success: true, data: list.map(formatDelegation) });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const d = await delegationService.getDelegationById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, error: "Delegació no trobada" });

    req.audit.resourceType = "delegation";
    req.audit.resource = String(d._id);
    return res.json({ success: true, data: formatDelegation(d) });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { toUserId, permission, reason, daysValid } = req.body;
    const d = await delegationService.createDelegation(
      {
        fromUserId: req.user._id,
        toUserId,
        permission,
        reason,
        daysValid,
      },
      req
    );
    req.audit.resourceType = "delegation";
    req.audit.resource = String(d._id);
    req.audit.changes = { toUserId, permission, daysValid };
    return res.status(201).json({
      success: true,
      message: "Delegació creada",
      data: formatDelegation(d),
    });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const d = await delegationService.updateDelegation(
      req.params.id,
      req.body,
      req.user._id,
      req
    );
    req.audit.resourceType = "delegation";
    req.audit.resource = String(d._id);
    return res.json({
      success: true,
      message: "Delegació actualitzada",
      data: formatDelegation(d),
    });
  } catch (err) {
    return next(err);
  }
};

exports.revoke = async (req, res, next) => {
  try {
    const d = await delegationService.revokeDelegation(
      req.params.id,
      req.user._id,
      req
    );
    req.audit.resourceType = "delegation";
    req.audit.resource = String(d._id);
    return res.json({
      success: true,
      message: "Delegació revocada",
      data: formatDelegation(d),
    });
  } catch (err) {
    return next(err);
  }
};

exports.byUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const list = await DelegatedPermission.find({
      $or: [{ toUserId: userId }, { fromUserId: userId }],
    })
      .populate("permission")
      .populate("fromUserId", "email firstName lastName")
      .populate("toUserId", "email firstName lastName")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        userId,
        received: list
          .filter((d) => String(d.toUserId._id || d.toUserId) === String(userId))
          .map(formatDelegation),
        granted: list
          .filter(
            (d) => String(d.fromUserId._id || d.fromUserId) === String(userId)
          )
          .map(formatDelegation),
      },
    });
  } catch (err) {
    return next(err);
  }
};
