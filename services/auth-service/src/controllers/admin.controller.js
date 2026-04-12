const User = require("../models/user.model");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -refreshToken");
    res.json({ count: users.length, users });
  } catch (err) {
    next(err);
  }
};

exports.verifyDoctor = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user || user.role !== "doctor") {
    return res.status(400).json({ msg: "Not a doctor" });
  }

  user.isVerified = true;
  await user.save();
  res.json({ msg: "Doctor verified" });
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const deleted = await User.findByIdAndDelete(id);

  if (!deleted) return res.status(404).json({ msg: "User not found" });

  res.json({ msg: "User deleted" });
};