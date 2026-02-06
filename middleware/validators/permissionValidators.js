const { body } = require("express-validator");
const Permission = require("../../models/Permission");

const createPermissionValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nom del permís és obligatori")
    .custom(async (value) => {
      const exists = await Permission.findOne({ name: value });
      if (exists) {
        throw new Error("Ja existeix un permís amb aquest nom");
      }
      return true;
    }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripció és obligatòria"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("La categoria és obligatòria"),
];

const updatePermissionValidators = [
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La descripció no pot estar buida"),
];

module.exports = {
  createPermissionValidators,
  updatePermissionValidators,
};
