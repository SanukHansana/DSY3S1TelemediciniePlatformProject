const { param } = require("express-validator");

exports.mongoIdValidator = [
  param("id")
    .notEmpty().withMessage("ID is required")
    .isMongoId().withMessage("Invalid MongoDB ID format")
];