module.exports = (req, res, next) => {
  const expectedApiKey =
    process.env.AUTH_SERVICE_API_KEY ||
    process.env.SERVICE_API_KEY ||
    "auth-service-api-key-2024";
  const apiKey = req.headers["x-service-api-key"];

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ msg: "Invalid service API key" });
  }

  return next();
};
