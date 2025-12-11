// index.js
// 🔹 Punt d'entrada de l'aplicació: connecta a MongoDB i arrenca el servidor Express

console.log("🚀 Iniciant API Gestor de Tasques...");

const app = require("./app");           // Express configurat
const connectDB = require("./config/db"); // Funció per connectar a MongoDB

const PORT = process.env.PORT || 3000;

// Connectem a la base de dades i, si tot va bé, engeguem el servidor
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Servidor funcionant a http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ No s'ha pogut iniciar el servidor per error a la BD:", err.message);
    process.exit(1);
  });
