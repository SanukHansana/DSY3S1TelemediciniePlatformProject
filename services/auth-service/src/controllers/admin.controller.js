const User = require("../models/user.model");

// GET ALL DOCTORS (pending or all)
exports.getAllUsers = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");

    res.json(doctors); // ✅ always returns array
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
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};