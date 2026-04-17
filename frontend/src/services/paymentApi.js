// paymentApi.js
// API service for payment-service

import axios from 'axios';

// Configurable base URL - can be updated based on environment
const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || '/api';

// Create axios instance with default configuration
const paymentApiInstance = axios.create({
  baseURL: PAYMENT_API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token if needed
paymentApiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or from context/state management
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
paymentApiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized access - please login again');
          // Redirect to login or refresh token
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error - please try again later');
          break;
        default:
          console.error(`API Error: ${data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    } else {
      // Other error
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

const paymentApi = {
  /**
   * Initiate a new payment
   * @param {Object} paymentData - Payment information
   * @param {string} paymentData.appointmentId - ID of the appointment
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.paymentMethod - Payment method (credit_card, debit_card, upi, etc.)
   * @returns {Promise<Object>} Payment response with payment ID and status
   */
  initiatePayment: async (paymentData) => {
    try {
      const response = await paymentApiInstance.post('/payments/initiate', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  },

  /**
   * Get payment details by payment ID
   * @param {string} paymentId - Unique payment identifier
   * @returns {Promise<Object>} Payment details including status, amount, timestamps
   */
  getPaymentById: async (paymentId) => {
    try {
      const response = await paymentApiInstance.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      throw error;
    }
  },

  /**
   * Get payment details by appointment ID
   * @param {string} appointmentId - Unique appointment identifier
   * @returns {Promise<Object>} Payment details for the specified appointment
   */
  getPaymentByAppointmentId: async (appointmentId) => {
    try {
      const response = await paymentApiInstance.get(`/payments/appointment/${appointmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment by appointment ID:', error);
      throw error;
    }
  },

  /**
   * Create a refund request for a payment
   * @param {Object} refundData - Refund information
   * @param {string} refundData.paymentId - ID of the payment to refund
   * @param {number} refundData.amount - Refund amount (optional, defaults to full amount)
   * @param {string} refundData.reason - Reason for refund
   * @returns {Promise<Object>} Refund request response with refund ID and status
   */
  createRefund: async (refundData) => {
    try {
      const response = await paymentApiInstance.post('/refunds', refundData);
      return response.data;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  },

  /**
   * Get refund status by refund ID
   * @param {string} refundId - Unique refund identifier
   * @returns {Promise<Object>} Refund details and status
   */
  getRefundById: async (refundId) => {
    try {
      const response = await paymentApiInstance.get(`/refunds/${refundId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching refund by ID:', error);
      throw error;
    }
  },

  /**
   * Add a new payment method for a user
   * @param {Object} paymentMethodData - Payment method information
   * @param {string} paymentMethodData.type - Type of payment method (credit_card, debit_card)
   * @param {string} paymentMethodData.cardNumber - Card number (16 digits)
   * @param {string} paymentMethodData.cardholderName - Name on card
   * @param {string} paymentMethodData.expiryMonth - Expiry month (MM)
   * @param {string} paymentMethodData.expiryYear - Expiry year (YYYY)
   * @param {string} paymentMethodData.cvv - CVV (3 digits)
   * @param {Object} paymentMethodData.billingAddress - Billing address
   * @param {boolean} paymentMethodData.isDefault - Set as default payment method
   * @returns {Promise<Object>} Created payment method details
   */
  addPaymentMethod: async (paymentMethodData) => {
    try {
      const response = await paymentApiInstance.post('/payment-methods', paymentMethodData);
      return response.data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  },

  /**
   * Get all payment methods for a user
   * @returns {Promise<Array>} List of user's payment methods
   */
  getPaymentMethods: async () => {
    try {
      const response = await paymentApiInstance.get('/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  /**
   * Delete a payment method
   * @param {string} paymentMethodId - Unique payment method identifier
   * @returns {Promise<Object>} Deletion confirmation
   */
  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await paymentApiInstance.delete(`/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  },

  /**
   * Set a payment method as default
   * @param {string} paymentMethodId - Unique payment method identifier
   * @returns {Promise<Object>} Updated payment method details
   */
  setDefaultPaymentMethod: async (paymentMethodId) => {
    try {
      const response = await paymentApiInstance.put(`/payment-methods/${paymentMethodId}/set-default`);
      return response.data;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  },
};

export default paymentApi;
