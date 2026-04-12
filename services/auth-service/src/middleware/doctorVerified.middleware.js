const User = require("../models/user.model");

module.exports = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.role === "doctor" && !user.isVerified) {
    return res.status(403).json({ msg: "Doctor not verified by admin" });
  }

  next();
};