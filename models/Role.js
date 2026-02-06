const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nom del rol és obligatori"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.methods.addPermission = function (permissionId) {
  const exists = this.permissions.some(
    (perm) => perm.toString() === permissionId.toString()
  );
  if (!exists) {
    this.permissions.push(permissionId);
  }
  return this.save();
};

roleSchema.methods.removePermission = function (permissionId) {
  this.permissions = this.permissions.filter(
    (perm) => perm.toString() !== permissionId.toString()
  );
  return this.save();
};

roleSchema.methods.hasPermission = async function (permissionName) {
  await this.populate("permissions");
  return this.permissions.some((perm) => perm.name === permissionName);
};

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
