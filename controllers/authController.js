const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_para_desarrollo";
const JWT_EXPIRES_IN = "24h";

// 1️⃣ Registre d'usuari
exports.register = (req, res) => {
  const { name, email, password, role } = req.body;

  User.create({ name, email, password, role })
    .then((user) => {
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      res.status(201).json({
        success: true,
        token,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    })
    .catch((error) => {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "L'email ja està registrat",
        });
      }
      res.status(400).json({
        success: false,
        error: error.message,
      });
    });
};

// 2️⃣ Inici de sessió
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Cal proporcionar email i contrasenya",
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Credencials incorrectes",
        });
      }

      return user.comparePassword(password).then((isMatch) => {
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: "Credencials incorrectes",
          });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
          expiresIn: JWT_EXPIRES_IN,
        });

        res.status(200).json({
          success: true,
          token,
          data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      });
    })
    .catch((error) => {
      res.status(500).json({
        success: false,
        error: "Error en el servidor",
      });
    });
};

// 3️⃣ Obtenir perfil (Me)
exports.getMe = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
};

// 4️⃣ Actualitzar perfil
exports.updateProfile = (req, res) => {
  const { name, email } = req.body;
  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (email) fieldsToUpdate.email = email;

  User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })
    .then((user) => {
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    })
    .catch((error) => {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "L'email ja està en ús",
        });
      }
      res.status(400).json({
        success: false,
        error: error.message,
      });
    });
};

// 5️⃣ Canviar contrasenya
exports.changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: "Cal proporcionar la contrasenya actual i la nova",
    });
  }

  User.findById(req.user.id)
    .then((user) => {
      return user.comparePassword(currentPassword).then((isMatch) => {
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: "La contrasenya actual és incorrecta",
          });
        }

        user.password = newPassword;
        return user.save();
      });
    })
    .then(() => {
      res.status(200).json({
        success: true,
        message: "Contrasenya actualitzada correctament",
      });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    });
};

// 8️⃣ Obtenir tots els usuaris (Només Admin)
exports.getUsers = (req, res) => {
  User.find().select("-password")
    .then((users) => {
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    })
    .catch((error) => res.status(500).json({ success: false, error: "Error de servidor" }));
};

// 9️⃣ Eliminar usuari (Només Admin)
exports.deleteUser = (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (!user) return res.status(404).json({ success: false, error: "Usuari no trobat" });
      res.status(200).json({ success: true, data: { message: "Usuari eliminat" } });
    })
    .catch((error) => res.status(500).json({ success: false, error: "Error de servidor" }));
};

// 🔟 Canviar rol d'usuari (Només Admin)
exports.changeUserRole = (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ success: false, error: "Rol no vàlid" });
  }

  User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) return res.status(404).json({ success: false, error: "Usuari no trobat" });
      res.status(200).json({ success: true, data: user });
    })
    .catch((error) => res.status(500).json({ success: false, error: "Error de servidor" }));
};
