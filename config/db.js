// config/db.js
// 🔹 Configuració i connexió a MongoDB amb Mongoose

const mongoose = require("mongoose");

// Pots canviar el nom de la base de dades si vols
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gestor_tasques";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Aquests opcions són estàndard (en versions noves alguns ja són per defecte)
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connexió a MongoDB correcta");
  } catch (error) {
    console.error("❌ Error connectant a MongoDB:", error.message);
    throw error;
  }
}

module.exports = connectDB;
