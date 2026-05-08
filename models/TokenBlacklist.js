// models/TokenBlacklist.js
// Llista de tokens revocats (logout o invalidació). Els documents s'esborren
// automàticament quan expiren gràcies a l'índex TTL sobre expiresAt.

const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenType: {
      type: String,
      enum: ["access", "refresh"],
      required: true,
    },
    revokedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false }
);

// TTL: MongoDB esborra automàticament el document quan expiresAt < ara
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

tokenBlacklistSchema.statics.isBlacklisted = async function (token) {
  if (!token) return false;
  const found = await this.findOne({ token }).lean();
  return Boolean(found);
};

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
