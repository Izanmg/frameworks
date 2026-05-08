// middleware/validators/authValidators.js
// Validadors d'entrada per a autenticació (T9)

const { body, param } = require("express-validator");

const passwordRule = body("password")
  .isString()
  .isLength({ min: 8 })
  .withMessage("La contrasenya ha de tenir almenys 8 caràcters")
  .matches(/[A-Z]/)
  .withMessage("La contrasenya ha de contenir almenys una majúscula")
  .matches(/[a-z]/)
  .withMessage("La contrasenya ha de contenir almenys una minúscula")
  .matches(/\d/)
  .withMessage("La contrasenya ha de contenir almenys un dígit");

exports.registerValidators = [
  body("email").isEmail().withMessage("Email invàlid").normalizeEmail(),
  passwordRule,
  body("firstName").trim().notEmpty().withMessage("El nom és obligatori"),
  body("lastName").trim().notEmpty().withMessage("El cognom és obligatori"),
];

exports.loginValidators = [
  body("email").isEmail().withMessage("Email invàlid").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Contrasenya obligatòria"),
];

exports.refreshValidators = [
  body("refreshToken")
    .isString()
    .notEmpty()
    .withMessage("Refresh token obligatori"),
];

exports.forgotPasswordValidators = [
  body("email").isEmail().withMessage("Email invàlid").normalizeEmail(),
];

exports.resetPasswordValidators = [
  param("token").isString().notEmpty().withMessage("Token obligatori"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("La nova contrasenya ha de tenir almenys 8 caràcters"),
];
