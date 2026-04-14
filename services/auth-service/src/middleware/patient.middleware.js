exports.patient = (req, res, next) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({ msg: "Access denied (Patient only)" });
  }
  next();
};