const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nom és obligatori"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email és obligatori"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "L'email no és vàlid"],
    },
    password: {
      type: String,
      required: [true, "La contrasenya és obligatòria"],
      minlength: [6, "La contrasenya ha de tenir almenys 6 caràcters"],
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Xifrar la contrasenya abans de guardar
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

// Mètode per comparar contrasenyes
userSchema.methods.comparePassword = function (candidatePassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

userSchema.methods.addRole = function (roleId) {
  const exists = this.roles.some((role) => role.toString() === roleId.toString());
  if (!exists) {
    this.roles.push(roleId);
  }
  return this.save();
};

userSchema.methods.removeRole = function (roleId) {
  this.roles = this.roles.filter((role) => role.toString() !== roleId.toString());
  return this.save();
};

userSchema.methods.getRoleNames = async function () {
  await this.populate("roles");
  return (this.roles || []).map((role) => role.name);
};

userSchema.methods.getPermissions = async function () {
  await this.populate({ path: "roles", populate: { path: "permissions" } });
  const permissions = [];
  (this.roles || []).forEach((role) => {
    (role.permissions || []).forEach((perm) => {
      if (perm && perm.name) {
        permissions.push(perm.name);
      }
    });
  });
  return permissions;
};

userSchema.methods.getEffectivePermissions = async function () {
  const permissions = await this.getPermissions();
  return [...new Set(permissions)];
};

userSchema.methods.hasPermission = async function (permissionName) {
  const permissions = await this.getEffectivePermissions();
  return permissions.includes(permissionName);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
