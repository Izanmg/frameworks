// models/Task.js
// 🔹 Model Mongoose per a la col·lecció de tasques

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // 🖊 Títol: obligatori
    title: {
      type: String,
      required: [true, "El títol és obligatori"],
      trim: true,
    },

    // 📄 Descripció: opcional
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // 💰 Cost: obligatori
    cost: {
      type: Number,
      required: [true, "El cost és obligatori"],
      min: [0, "El cost no pot ser negatiu"],
    },

    // ⏳ Previsió d'hores: obligatori
    hours_estimated: {
      type: Number,
      required: [true, "La previsió d'hores és obligatòria"],
      min: [0, "Les hores estimades no poden ser negatives"],
    },

    // ⌛ Hores reals: opcional
    hours_real: {
      type: Number,
      default: 0,
      min: [0, "Les hores reals no poden ser negatives"],
    },

    // 🖼 Imatge: URL o ruta (opcional)
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // ✅ Completada: per defecte false
    completed: {
      type: Boolean,
      default: false,
    },

    // 📅 Data de finalització: s'omple automàticament quan es completa
    finished_at: {
      type: Date,
      default: null,
    },
  },
  {
    // 🕒 Afegim timestamps automàtics
    // Això crea createdAt i updatedAt automàticament
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// 🔁 Hook per assegurar que finished_at es posa quan la tasca es marca com completada
taskSchema.pre("save", function (next) {
  // this.isModified('completed') → només si canvia el valor de completed
  if (this.isModified("completed") && this.completed && !this.finished_at) {
    this.finished_at = new Date();
  }
  // Si es volgués “descompletar” una tasca, podríem netejar finished_at:
  // else if (this.isModified("completed") && !this.completed) {
  //   this.finished_at = null;
  // }
  next();
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
