const router = require("express").Router();
const { register, login, getUserForService } = require("../controllers/auth.controller");
const { registerValidator, loginValidator } = require("../validators/auth.validator");
const validate = require("../middleware/validate.middleware");
const serviceAuth = require("../middleware/serviceAuth.middleware");

// Sanity check (remove after fix)
console.log({ register, login, registerValidator, loginValidator, validate });

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/users/:id", serviceAuth, getUserForService);

module.exports = router;
