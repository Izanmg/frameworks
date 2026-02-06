const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const auditMiddleware = require("../middleware/auditMiddleware");

// Totes les rutes de tasques requereixen estar autenticat
router.use(protect, auditMiddleware);

// ?? Estadístiques
router.get("/stats", checkPermission("tasks:read"), taskController.getTaskStats);

// ?? CRUD de tasques
router.post("/", checkPermission("tasks:create"), taskController.createTask);
router.get("/", checkPermission("tasks:read"), taskController.getTasks);
router.get("/:id", checkPermission("tasks:read"), taskController.getTaskById);
router.put("/:id", checkPermission("tasks:update"), taskController.updateTask);
router.delete("/:id", checkPermission("tasks:delete"), taskController.deleteTask);

// ?? Gestió d'imatges de tasques
router.put(
  "/:id/image",
  checkPermission("tasks:update"),
  taskController.updateTaskImage
);
router.put(
  "/:id/image/reset",
  checkPermission("tasks:update"),
  taskController.resetTaskImageToDefault
);

module.exports = router;
