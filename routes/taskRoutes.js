// routes/taskRoutes.js
// 🔹 Definició de les rutes de l'API per a les tasques

const express = require("express");
const router = express.Router();

// Importem les funcions del controlador
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
  updateTaskImage,
  resetTaskImageToDefault,
} = require("../controllers/taskController");

// 1️⃣ Crear una nova tasca
// POST http://localhost:3000/api/tasks
router.post("/tasks", createTask);

// 2️⃣ Obtenir totes les tasques
// GET http://localhost:3000/api/tasks
router.get("/tasks", getTasks);

// 3️⃣ Obtenir una tasca per ID
// GET http://localhost:3000/api/tasks/:id
router.get("/tasks/:id", getTaskById);

// 4️⃣ Actualitzar una tasca
// PUT http://localhost:3000/api/tasks/:id
router.put("/tasks/:id", updateTask);

// 5️⃣ Eliminar una tasca
// DELETE http://localhost:3000/api/tasks/:id
router.delete("/tasks/:id", deleteTask);

// 6️⃣ Estadístiques
// GET http://localhost:3000/api/tasks/stats
router.get("/tasks/stats", getTaskStats);

// 7️⃣ Actualitzar imatge
// PUT http://localhost:3000/api/tasks/:id/image
router.put("/tasks/:id/image", updateTaskImage);

// 8️⃣ Restablir imatge per defecte
// PUT http://localhost:3000/api/tasks/:id/image/reset
router.put("/tasks/:id/image/reset", resetTaskImageToDefault);

module.exports = router;
