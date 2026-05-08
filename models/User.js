// models/User.js
// Model d'usuari (T9 - amb firstName/lastName, role principal i permisos delegats)

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email és obligatori"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "L'email no és vàlid",
      ],
    },
    password: {
      type: String,
      required: [true, "La contrasenya és obligatòria"],
      minlength: [8, "La contrasenya ha de tenir almenys 8 caràcters"],
    },
    firstName: {
      type: String,
      required: [true, "El nom és obligatori"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "El cognom és obligatori"],
      trim: true,
    },
    // Rol principal (jerarquia)
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    // Compatibilitat T8: array de rols (es manté sincronitzat amb role)
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    // Permisos extra (delegats individualment)
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual: nom complet
userSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

// Compatibilitat amb T7/T8 (camp "name")
userSchema.virtual("name").get(function () {
  return this.fullName;
});

// Sincronitzar role <-> roles abans de guardar
userSchema.pre("save", function (next) {
  if (this.role && (!this.roles || this.roles.length === 0)) {
    this.roles = [this.role];
  } else if (
    !this.role &&
    this.roles &&
    this.roles.length > 0
  ) {
    this.role = this.roles[0];
  }
  next();
});

// Hash de la contrasenya abans de guardar
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  bcrypt.genSalt(12, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.addRole = function (roleId) {
  const exists = (this.roles || []).some(
    (r) => r.toString() === roleId.toString()
  );
  if (!exists) this.roles.push(roleId);
  if (!this.role) this.role = roleId;
  return this.save();
};

userSchema.methods.removeRole = function (roleId) {
  this.roles = (this.roles || []).filter(
    (r) => r.toString() !== roleId.toString()
  );
  if (this.role && this.role.toString() === roleId.toString()) {
    this.role = this.roles[0] || null;
  }
  return this.save();
};

userSchema.methods.getRoleNames = async function () {
  await this.populate("roles");
  return (this.roles || []).map((r) => r.name);
};

// Índexs útils (email ja és unique al schema)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model("User", userSchema);
