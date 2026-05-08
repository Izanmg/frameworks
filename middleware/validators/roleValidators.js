// middleware/validators/roleValidators.js
// Validadors d'entrada per a la gestió de rols (T9 - amb level i parentRole)

const { body } = require("express-validator");
const Role = require("../../models/Role");

const createRoleValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nom del rol és obligatori")
    .custom(async (value) => {
      const exists = await Role.findOne({ name: value.toLowerCase() });
      if (exists) {
        throw new Error("Ja existeix un rol amb aquest nom");
      }
      return true;
    }),
  body("level")
    .isInt({ min: 1, max: 10 })
    .withMessage("level ha de ser un nombre entre 1 i 10"),
  body("parentRole")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("parentRole ha de ser un ObjectId vàlid"),
  body("description").optional().isString(),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Els permisos han de ser un array"),
];

const updateRoleValidators = [
  body("name").optional().trim().notEmpty(),
  body("description").optional().isString(),
  body("level").optional().isInt({ min: 1, max: 10 }),
  body("parentRole")
    .optional({ nullable: true })
    .custom((v) => v === null || /^[0-9a-fA-F]{24}$/.test(v))
    .withMessage("parentRole ha de ser un ObjectId vàlid o null"),
  body("permissions").optional().isArray(),
];

module.exports = { createRoleValidators, updateRoleValidators };
