// utils/seedAll.js
// Script CLI per executar tots els seeds del sistema

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const seedPermissions = require("./seedPermissions");
const seedRoles = require("./seedRoles");
const seedAdmin = require("./seedAdmin");

async function run() {
  try {
    await connectDB();
    console.log("🌱 Sembrant permisos...");
    await seedPermissions();
    console.log("🌱 Sembrant rols (jerarquia)...");
    await seedRoles();
    console.log("🌱 Creant usuari admin per defecte...");
    await seedAdmin();
    console.log("✅ Seed complet.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al seed:", err);
    process.exit(1);
  }
}

run();
