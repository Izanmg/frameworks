const { body } = require("express-validator");
const Role = require("../../models/Role");

const createRoleValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nom del rol és obligatori")
    .custom(async (value) => {
      const exists = await Role.findOne({ name: value });
      if (exists) {
        throw new Error("Ja existeix un rol amb aquest nom");
      }
      return true;
    }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripció és obligatòria"),
  body("permissions")
    .isArray({ min: 1 })
    .withMessage("Has d'indicar almenys un permís"),
];

const updateRoleValidators = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nom del rol no pot estar buit"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La descripció no pot estar buida"),
  body("permissions")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Els permisos han de ser un array"),
];

module.exports = {
  createRoleValidators,
  updateRoleValidators,
};
