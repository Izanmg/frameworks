// models/AuditLog.js
// Auditoria avançada (T9): registra qui, què, quan, on, canvis i durada.

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      default: "",
    },
    resourceType: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "error"],
      required: true,
      index: true,
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
    duration: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

auditLogSchema.statics.log = function (
  userId,
  action,
  resource,
  resourceType,
  status,
  changes,
  req,
  errorMessage,
  duration
) {
  const ipAddress = req
    ? req.ip || req.headers["x-forwarded-for"] || ""
    : "";
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
    duration: duration || 0,
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
  const errorCount = await this.countDocuments({ status: "error" });
  const successRate =
    totalActions === 0
      ? 0
      : Number(((successCount / totalActions) * 100).toFixed(2));

  const topActions = await this.aggregate([
    { $group: { _id: "$action", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, action: "$_id", count: 1 } },
  ]);

  const topUsers = await this.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
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
        userEmail: "$user.email",
        userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
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
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        action: "$_id.action",
        error: "$_id.error",
        count: 1,
      },
    },
  ]);

  const avgDuration = await this.aggregate([
    { $group: { _id: null, avg: { $avg: "$duration" } } },
  ]);

  return {
    totalActions,
    successCount,
    errorCount,
    successRate,
    avgDurationMs: avgDuration.length
      ? Number(avgDuration[0].avg.toFixed(2))
      : 0,
    topActions,
    topUsers,
    recentErrors,
  };
};

auditLogSchema.statics.getStatsForUser = async function (userId) {
  const total = await this.countDocuments({ userId });
  const successCount = await this.countDocuments({
    userId,
    status: "success",
  });
  const errorCount = await this.countDocuments({ userId, status: "error" });
  const topActions = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(String(userId)) } },
    { $group: { _id: "$action", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, action: "$_id", count: 1 } },
  ]);
  return { total, successCount, errorCount, topActions };
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
