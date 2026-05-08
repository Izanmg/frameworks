// models/Role.js
// Model de rol amb jerarquia (T9): level + parentRole permeten herència de permisos

const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nom del rol és obligatori"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    level: {
      type: Number,
      required: [true, "El nivell del rol és obligatori"],
      min: [1, "El nivell mínim és 1"],
      max: [10, "El nivell màxim és 10"],
    },
    parentRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

roleSchema.methods.addPermission = function (permissionId) {
  const exists = this.permissions.some(
    (p) => p.toString() === permissionId.toString()
  );
  if (!exists) this.permissions.push(permissionId);
  return this.save();
};

roleSchema.methods.removePermission = function (permissionId) {
  this.permissions = this.permissions.filter(
    (p) => p.toString() !== permissionId.toString()
  );
  return this.save();
};

roleSchema.index({ level: 1 });
roleSchema.index({ parentRole: 1 });

module.exports = mongoose.model("Role", roleSchema);
