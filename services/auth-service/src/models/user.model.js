const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient"
  },
  isVerified: {
    type: Boolean,
    default: false // for doctors
  }
});

module.exports = mongoose.model("User", userSchema);  