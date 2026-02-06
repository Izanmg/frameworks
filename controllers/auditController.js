const AuditLog = require("../models/AuditLog");

function formatLog(log) {
  return {
    id: log._id,
    userId: log.userId?._id || log.userId,
    userName: log.userId?.name || undefined,
    action: log.action,
    resource: log.resource,
    resourceType: log.resourceType,
    status: log.status,
    changes: log.changes,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.timestamp,
  };
}

exports.getAuditLogs = async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filters = {};

    if (userId) filters.userId = userId;
    if (action) filters.action = action;

    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, count] = await Promise.all([
      AuditLog.find(filters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "name"),
      AuditLog.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      count,
      data: logs.map(formatLog),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate("userId", "name");
    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Registre no trobat",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatLog(log),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "ID no vàlid",
    });
  }
};

exports.getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .populate("userId", "name");

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs.map(formatLog),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const stats = await AuditLog.getStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};

exports.exportAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    const headers = [
      "id",
      "userId",
      "action",
      "resource",
      "resourceType",
      "status",
      "timestamp",
    ];

    const rows = logs.map((log) => [
      log._id,
      log.userId,
      log.action,
      log.resource,
      log.resourceType,
      log.status,
      log.timestamp.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error de servidor",
    });
  }
};
