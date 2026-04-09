export const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  
  warn: (message, data = null) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

export const formatPhoneNumber = (phone) => {
  // Basic phone number formatting
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phone; // Return as-is if format is unexpected
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const sanitizePayload = (payload) => {
  // Remove sensitive information from payload for logging
  const sanitized = { ...payload };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

export const retryAsync = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};
