// models/PasswordReset.js
// Token de recuperació de contrasenya (un sol ús, expirable). T9.

const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL: s'esborra quan caduca
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

passwordResetSchema.methods.isValid = function () {
  return !this.usedAt && this.expiresAt > new Date();
};

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
