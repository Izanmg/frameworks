// controllers/taskController.js
// 🔹 Lògica de negoci per a les tasques (CRUD + estadístiques + imatges)
// 🔹 Tot amb PROMESES (.then/.catch), sense async/await

const Task = require("../models/Task");

const DEFAULT_TASK_IMAGE =
  process.env.DEFAULT_TASK_IMAGE || "http://localhost:3000/uploads/default-task.jpg";

// Helper per gestionar errors de Mongoose de forma consistent
function handleMongooseError(res, error) {
  console.error("Error a controlador de tasques:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Dades de tasca no vàlides",
      details: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "ID de tasca no vàlid",
    });
  }

  return res.status(500).json({
    success: false,
    error: "Error intern del servidor",
  });
}

// 1️⃣ Crear una nova tasca
// POST /api/tasks
exports.createTask = (req, res) => {
  const {
    title,
    description,
    cost,
    hours_estimated,
    hours_real = 0,
    completed = false,
    image,
  } = req.body;

  const imageToSave =
    image && typeof image === "string" && image.trim() !== ""
      ? image.trim()
      : DEFAULT_TASK_IMAGE;

  const newTaskData = {
    title,
    description,
    cost,
    hours_estimated,
    hours_real,
    completed,
    image: imageToSave,
  };

  Task.create(newTaskData)
    .then((task) => {
      res.status(201).json({
        success: true,
        data: task,
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 2️⃣ Obtenir totes les tasques
// GET /api/tasks
exports.getTasks = (req, res) => {
  Task.find()
    .then((tasks) => {
      res.status(200).json({
        success: true,
        data: tasks,
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 3️⃣ Obtenir una tasca per ID
// GET /api/tasks/:id
exports.getTaskById = (req, res) => {
  const { id } = req.params;

  Task.findById(id)
    .then((task) => {
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Tasca amb ID ${id} no trobada`,
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 4️⃣ Actualitzar una tasca completa
// PUT /api/tasks/:id
exports.updateTask = (req, res) => {
  const { id } = req.params;

  Task.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .then((task) => {
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Tasca amb ID ${id} no trobada`,
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 5️⃣ Eliminar una tasca
// DELETE /api/tasks/:id
exports.deleteTask = (req, res) => {
  const { id } = req.params;

  Task.findByIdAndDelete(id)
    .then((task) => {
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Tasca amb ID ${id} no trobada`,
        });
      }

      res.status(200).json({
        success: true,
        data: { message: `Tasca amb ID ${id} eliminada correctament` },
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 6️⃣ Actualitzar només la IMATGE d'una tasca
// PUT /api/tasks/:id/image
exports.updateTaskImage = (req, res) => {
  const { id } = req.params;
  const { image } = req.body;

  if (!image || typeof image !== "string" || image.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Cal enviar una URL d'imatge vàlida al camp 'image'",
    });
  }

  Task.findByIdAndUpdate(
    id,
    { image: image.trim() },
    { new: true, runValidators: true }
  )
    .then((task) => {
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Tasca amb ID ${id} no trobada`,
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 7️⃣ Restablir imatge per defecte
// PUT /api/tasks/:id/image/reset
exports.resetTaskImageToDefault = (req, res) => {
  const { id } = req.params;

  Task.findByIdAndUpdate(
    id,
    { image: DEFAULT_TASK_IMAGE },
    { new: true, runValidators: true }
  )
    .then((task) => {
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Tasca amb ID ${id} no trobada`,
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    })
    .catch((error) => handleMongooseError(res, error));
};

// 8️⃣ Estadístiques de tasques
// GET /api/tasks/stats
exports.getTaskStats = (req, res) => {
  Task.find()
    .then((tasks) => {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.completed).length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate =
        totalTasks === 0
          ? 0
          : Number(((completedTasks / totalTasks) * 100).toFixed(2));

      // 💰 Costos
      const totalCost = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
      const completedTasksCost = tasks
        .filter((t) => t.completed)
        .reduce((sum, t) => sum + (t.cost || 0), 0);
      const pendingTasksCost = totalCost - completedTasksCost;

      const averageCostPerTask =
        totalTasks === 0 ? 0 : Number((totalCost / totalTasks).toFixed(2));
      const averageCostCompleted =
        completedTasks === 0
          ? 0
          : Number((completedTasksCost / completedTasks).toFixed(2));
      const averageCostPending =
        pendingTasks === 0
          ? 0
          : Number((pendingTasksCost / pendingTasks).toFixed(2));

      // ⏱ Hores
      const totalHoursEstimated = tasks.reduce(
        (sum, t) => sum + (t.hours_estimated || 0),
        0
      );
      const totalHoursReal = tasks.reduce(
        (sum, t) => sum + (t.hours_real || 0),
        0
      );

      const timeEfficiency =
        totalHoursEstimated === 0
          ? 0
          : Number(((totalHoursReal / totalHoursEstimated) * 100).toFixed(2));

      const hoursDifference = totalHoursReal - totalHoursEstimated;
      const hoursOverrun = hoursDifference > 0 ? hoursDifference : 0;
      const hoursSaved = hoursDifference < 0 ? Math.abs(hoursDifference) : 0;

      const averageHoursEstimated =
        totalTasks === 0
          ? 0
          : Number((totalHoursEstimated / totalTasks).toFixed(2));
      const averageHoursReal =
        totalTasks === 0
          ? 0
          : Number((totalHoursReal / totalTasks).toFixed(2));

      // 🕒 Estadístiques temporals (dates)
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Inici de setmana (dilluns)
      const day = startOfToday.getDay(); // 0 = diumenge
      const diff = (day === 0 ? -6 : 1) - day;
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() + diff);

      const tasksThisMonth = tasks.filter(
        (t) => t.createdAt && t.createdAt >= startOfMonth
      ).length;
      const tasksThisWeek = tasks.filter(
        (t) => t.createdAt && t.createdAt >= startOfWeek
      ).length;
      const tasksToday = tasks.filter(
        (t) => t.createdAt && t.createdAt >= startOfToday
      ).length;

      const completedThisMonth = tasks.filter(
        (t) => t.completed && t.finished_at && t.finished_at >= startOfMonth
      ).length;
      const completedThisWeek = tasks.filter(
        (t) => t.completed && t.finished_at && t.finished_at >= startOfWeek
      ).length;
      const completedToday = tasks.filter(
        (t) => t.completed && t.finished_at && t.finished_at >= startOfToday
      ).length;

      // 📄 Descripció + imatges
      const tasksWithDescription = tasks.filter(
        (t) => t.description && t.description.trim() !== ""
      ).length;
      const tasksWithoutDescription = totalTasks - tasksWithDescription;

      let defaultImages = 0;
      let customImages = 0;
      let cloudinaryImages = 0;
      let localImages = 0;

      tasks.forEach((t) => {
        const img = t.image;

        if (!img || img.trim() === "") return;

        if (img === DEFAULT_TASK_IMAGE) {
          defaultImages++;
        } else {
          customImages++;
          if (img.includes("res.cloudinary.com")) {
            cloudinaryImages++;
          }
          if (img.startsWith("http://localhost:3000/uploads")) {
            localImages++;
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          overview: {
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate,
          },
          financial: {
            totalCost,
            completedTasksCost,
            pendingTasksCost,
            averageCostPerTask,
            averageCostCompleted,
            averageCostPending,
          },
          time: {
            totalHoursEstimated,
            totalHoursReal,
            timeEfficiency,
            averageHoursEstimated,
            averageHoursReal,
            hoursDifference,
            hoursOverrun,
            hoursSaved,
          },
          recent: {
            tasksThisMonth,
            completedThisMonth,
            tasksThisWeek,
            completedThisWeek,
            tasksToday,
            completedToday,
          },
          misc: {
            tasksWithDescription,
            tasksWithoutDescription,
            imageStats: {
              defaultImages,
              customImages,
              cloudinaryImages,
              localImages,
            },
          },
        },
      });
    })
    .catch((error) => handleMongooseError(res, error));
};
