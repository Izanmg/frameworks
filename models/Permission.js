const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "El nom del permís és obligatori"],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, "La descripció del permís és obligatòria"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "La categoria del permís és obligatòria"],
    trim: true,
  },
  isSystemPermission: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Permission = mongoose.model("Permission", permissionSchema);

module.exports = Permission;
