// utils/seedAdmin.js
// Crea un usuari admin per defecte si no existeix (per facilitar les proves T9)

const User = require("../models/User");
const Role = require("../models/Role");

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  const existing = await User.findOne({ email });
  if (existing) return;

  const adminRole =
    (await Role.findOne({ name: "super_admin" })) ||
    (await Role.findOne({ name: "admin" }));
  if (!adminRole) {
    console.warn("⚠️ No s'ha trobat rol admin. Assegura't que els seeds de rols s'han executat.");
    return;
  }

  await User.create({
    email,
    password,
    firstName: "Super",
    lastName: "Admin",
    role: adminRole._id,
    roles: [adminRole._id],
    isActive: true,
  });

  console.log(`✅ Usuari admin creat: ${email} / ${password}`);
}

module.exports = seedAdmin;
