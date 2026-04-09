const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-service-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }
  
  // Use hardcoded key for testing since .env is not loading properly
  const serviceApiKey = process.env.SERVICE_API_KEY || 'notification-service-api-key-2024';
  
  if (apiKey !== serviceApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  next();
};

export default validateApiKey;