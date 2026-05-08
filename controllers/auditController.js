// controllers/auditController.js
// Auditoria avançada (T9): logs, filtres, stats, export CSV/JSON

const AuditLog = require("../models/AuditLog");

function formatLog(log) {
  return {
    id: log._id,
    user: log.userId
      ? {
          id: log.userId._id || log.userId,
          email: log.userId.email,
          name:
            log.userId.firstName && log.userId.lastName
              ? `${log.userId.firstName} ${log.userId.lastName}`
              : undefined,
        }
      : null,
    action: log.action,
    resource: log.resource,
    resourceType: log.resourceType,
    status: log.status,
    changes: log.changes,
    errorMessage: log.errorMessage,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    duration: log.duration,
    timestamp: log.timestamp,
  };
}

exports.list = async (req, res, next) => {
  try {
    const {
      userId,
      action,
      resourceType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const pageN = Math.max(1, Number(page));
    const limitN = Math.min(200, Math.max(1, Number(limit)));
    const skip = (pageN - 1) * limitN;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitN)
        .populate("userId", "email firstName lastName"),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: logs.map(formatLog),
      pagination: {
        total,
        page: pageN,
        limit: limitN,
        pages: Math.ceil(total / limitN),
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      "userId",
      "email firstName lastName"
    );
    if (!log)
      return res
        .status(404)
        .json({ success: false, error: "Registre no trobat" });
    return res.json({ success: true, data: formatLog(log) });
  } catch (err) {
    return next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await AuditLog.getStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    return next(err);
  }
};

exports.getStatsByUser = async (req, res, next) => {
  try {
    const stats = await AuditLog.getStatsForUser(req.params.userId);
    return res.json({
      success: true,
      data: { userId: req.params.userId, ...stats },
    });
  } catch (err) {
    return next(err);
  }
};

exports.exportLogs = async (req, res, next) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10000)
      .populate("userId", "email firstName lastName")
      .lean();

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${Date.now()}.json`
      );
      return res.send(JSON.stringify(logs, null, 2));
    }

    const headers = [
      "id",
      "userId",
      "userEmail",
      "action",
      "resource",
      "resourceType",
      "status",
      "duration",
      "ipAddress",
      "timestamp",
    ];
    const escape = (v) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = logs.map((l) => [
      l._id,
      l.userId?._id || l.userId || "",
      l.userId?.email || "",
      l.action,
      l.resource,
      l.resourceType,
      l.status,
      l.duration,
      l.ipAddress,
      l.timestamp.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map(escape).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-logs-${Date.now()}.csv`
    );
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
};
