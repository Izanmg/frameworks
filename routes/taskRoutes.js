const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

// Totes les rutes de tasques requereixen estar autenticat
router.use(protect);

// 📊 Estadístiques
router.get("/stats", taskController.getTaskStats);

// 📝 CRUD de tasques
router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.get("/:id", taskController.getTaskById);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

// 🖼 Gestió d'imatges de tasques
router.put("/:id/image", taskController.updateTaskImage);
router.put("/:id/image/reset", taskController.resetTaskImageToDefault);

module.exports = router;
