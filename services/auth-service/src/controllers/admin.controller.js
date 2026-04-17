const User = require("../models/user.model");

// GET ALL DOCTORS (pending or all)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json(users); // ✅ returns doctors + patients
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// VERIFY DOCTOR
exports.verifyDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await User.findById(id);

    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found" });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({ msg: "User is not a doctor" });
    }

    doctor.isVerified = true;
    await doctor.save();

    res.json({
      msg: "Doctor verified successfully",
      doctor,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 🚫 Prevent deleting admin
    if (user.role === "admin") {
      return res.status(403).json({ msg: "Cannot delete admin" });
    }

    await user.deleteOne();

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};