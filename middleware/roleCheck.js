const checkPermission = require("./checkPermission");

// Compatibilitat amb l'antic middleware de rols
module.exports = (permission) => checkPermission(permission);
