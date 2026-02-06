const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    default: "",
  },
  resourceType: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["success", "error"],
    required: true,
  },
  changes: {
    type: Object,
    default: null,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  ipAddress: {
    type: String,
    default: "",
  },
  userAgent: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.statics.log = function (
  userId,
  action,
  resource,
  resourceType,
  status,
  changes,
  req,
  errorMessage
) {
  const ipAddress = req ? req.ip || req.headers["x-forwarded-for"] || "" : "";
  const userAgent = req ? req.headers["user-agent"] || "" : "";

  return this.create({
    userId,
    action,
    resource: resource || "",
    resourceType: resourceType || "",
    status,
    changes: changes || null,
    errorMessage: errorMessage || "",
    ipAddress,
    userAgent,
    timestamp: new Date(),
  });
};

auditLogSchema.statics.getByUser = function (userId, limit = 20, skip = 0) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

auditLogSchema.statics.getByAction = function (action, limit = 20, skip = 0) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

auditLogSchema.statics.getStats = async function () {
  const totalActions = await this.countDocuments();
  const successCount = await this.countDocuments({ status: "success" });
  const successRate =
    totalActions === 0
      ? 0
      : Number(((successCount / totalActions) * 100).toFixed(2));

  const topActions = await this.aggregate([
    { $group: { _id: "$action", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, action: "$_id", count: 1 } },
  ]);

  const topUsers = await this.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        userName: "$user.name",
        count: 1,
      },
    },
  ]);

  const recentErrors = await this.aggregate([
    { $match: { status: "error" } },
    {
      $group: {
        _id: { action: "$action", error: "$errorMessage" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        action: "$_id.action",
        error: "$_id.error",
        count: 1,
      },
    },
  ]);

  return {
    totalActions,
    successRate,
    topActions,
    topUsers,
    recentErrors,
  };
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
