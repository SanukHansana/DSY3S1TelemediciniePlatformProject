import axios from 'axios';
import { logger } from '../utils/helpers.js';

// Notification service configuration
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006';
const SERVICE_API_KEY = process.env.NOTIFICATION_SERVICE_API_KEY || 'notification-service-api-key-2024';

// Create axios instance with default headers
const notificationClient = axios.create({
  baseURL: NOTIFICATION_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'x-service-api-key': SERVICE_API_KEY
  }
});

// Send notification function with error handling
export const sendNotification = async (eventType, payload) => {
  try {
    const notificationPayload = {
      recipientId: payload.patientId,
      recipientRole: 'PATIENT',
      channel: 'EMAIL',
      eventType,
      payload: {
        appointmentId: payload.appointmentId,
        amount: payload.amount,
        currency: payload.currency,
        paymentId: payload.paymentId,
        refundId: payload.refundId,
        email: 'patient@example.com' // In production, this would come from patient data
      }
    };

    logger.info(`Sending ${eventType} notification`, { 
      eventType, 
      payload: sanitizePayload(notificationPayload) 
    });

    const response = await notificationClient.post('/api/notifications/send', notificationPayload);
    
    logger.info(`Notification sent successfully for ${eventType}`, { 
      notificationId: response.data.data?.notificationId 
    });

    return {
      success: true,
      notificationId: response.data.data?.notificationId,
      message: response.data.message
    };

  } catch (error) {
    logger.error(`Failed to send ${eventType} notification`, {
      error: error.message,
      response: error.response?.data,
      payload: sanitizePayload(payload)
    });

    // Return error but don't throw to avoid breaking payment flow
    return {
      success: false,
      error: error.message,
      message: 'Notification service unavailable'
    };
  }
};

// Helper function to sanitize payload for logging
const sanitizePayload = (payload) => {
  const sanitized = { ...payload };
  if (sanitized.payload && sanitized.payload.email) {
    sanitized.payload.email = '[REDACTED]';
  }
  return sanitized;
};

// Specific notification functions for payment events
export const sendPaymentSuccessNotification = async (paymentData) => {
  return await sendNotification('PAYMENT_CONFIRMED', {
    appointmentId: paymentData.appointmentId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    paymentId: paymentData._id || paymentData.paymentId,
    patientId: paymentData.patientId
  });
};

export const sendPaymentFailedNotification = async (paymentData) => {
  return await sendNotification('PAYMENT_FAILED', {
    appointmentId: paymentData.appointmentId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    paymentId: paymentData._id || paymentData.paymentId,
    patientId: paymentData.patientId
  });
};

export const sendPaymentRefundedNotification = async (paymentData, refundData) => {
  return await sendNotification('PAYMENT_REFUNDED', {
    appointmentId: paymentData.appointmentId,
    amount: refundData.amount,
    currency: paymentData.currency,
    paymentId: paymentData._id || paymentData.paymentId,
    refundId: refundData._id || refundData.refundId,
    patientId: paymentData.patientId
  });
};

export default notificationClient;
