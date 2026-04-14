exports.doctor = (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ msg: "Access denied (Doctor only)" });
  }
  next();
};