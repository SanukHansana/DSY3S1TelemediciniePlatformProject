const router = require("express").Router();
const { register, login } = require("../controllers/auth.controller");
const { registerValidator, loginValidator } = require("../validators/auth.validator");
const validate = require("../middleware/validate.middleware");

// Sanity check (remove after fix)
console.log({ register, login, registerValidator, loginValidator, validate });

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);

module.exports = router;