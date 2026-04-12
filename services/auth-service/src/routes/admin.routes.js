const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { admin } = require("../middleware/admin.middleware");
const { mongoIdValidator } = require("../validators/admin.validator");
const validate = require("../middleware/validate.middleware");
const { getAllUsers, verifyDoctor, deleteUser } = require("../controllers/admin.controller");

router.get("/users",                auth, admin,                              getAllUsers);
router.put("/verify-doctor/:id",    auth, admin, mongoIdValidator, validate,  verifyDoctor);
router.delete("/user/:id",          auth, admin, mongoIdValidator, validate,  deleteUser);

module.exports = router;