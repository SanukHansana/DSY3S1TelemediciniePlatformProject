const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { admin } = require("../middleware/admin.middleware");
const { mongoIdValidator } = require("../validators/admin.validator");
const validate = require("../middleware/validate.middleware");

const {
  getAllUsers,
  verifyDoctor,
  deleteUser,
  updateUser, // ✅ FIXED
} = require("../controllers/admin.controller");

router.get("/users", auth, admin, getAllUsers);

router.put("/verify-doctor/:id", auth, admin, mongoIdValidator, validate, verifyDoctor);

router.delete("/users/:id", auth, admin, mongoIdValidator, validate, deleteUser);

router.put("/users/:id", auth, admin, mongoIdValidator, validate, updateUser); // ✅ FIXED

module.exports = router;