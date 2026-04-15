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

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const generateTransactionId = () => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const calculateRefundAmount = (paymentAmount, refundPercentage = 100) => {
  return (paymentAmount * refundPercentage) / 100;
};

export const validatePaymentStatus = (currentStatus, newStatus) => {
  const statusTransitions = {
    'PENDING': ['SUCCESS', 'FAILED'],
    'SUCCESS': ['REFUNDED'],
    'FAILED': [],
    'REFUNDED': []
  };

  return statusTransitions[currentStatus]?.includes(newStatus) || false;
};

export const sanitizePayload = (payload) => {
  // Remove sensitive information from payload for logging
  const sanitized = { ...payload };
  const sensitiveFields = ['cardNumber', 'cvv', 'expiry', 'password', 'token', 'secret', 'key'];
  
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

export const generateWebhookSignature = (payload, secret) => {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
};

export const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return signature === expectedSignature;
};
