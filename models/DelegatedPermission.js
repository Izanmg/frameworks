// models/DelegatedPermission.js
// Delegació temporal d'un permís d'un usuari a un altre (T9)

const mongoose = require("mongoose");

const delegatedPermissionSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    delegatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

delegatedPermissionSchema.index({ toUserId: 1, status: 1 });
delegatedPermissionSchema.index({ expiresAt: 1 });

// Marca com a expirada si ha passat la data
delegatedPermissionSchema.methods.checkExpiration = function () {
  if (this.status === "active" && this.expiresAt < new Date()) {
    this.status = "expired";
  }
  return this;
};

// Helper estàtic: troba delegacions actives vigents per a un usuari
delegatedPermissionSchema.statics.findActiveForUser = function (userId) {
  return this.find({
    toUserId: userId,
    status: "active",
    expiresAt: { $gt: new Date() },
  }).populate("permission");
};

module.exports = mongoose.model(
  "DelegatedPermission",
  delegatedPermissionSchema
);
