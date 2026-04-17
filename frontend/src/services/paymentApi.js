import axios from 'axios';

const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || '/api';

const paymentApiInstance = axios.create({
  baseURL: PAYMENT_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

paymentApiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

paymentApiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error('Unauthorized access - please login again');
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
      console.error('Network error - please check your connection');
    } else {
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

const unwrapData = (payload) => payload?.data ?? payload;

const normalizeStatus = (status) =>
  typeof status === 'string' ? status.toLowerCase() : status;

const normalizePayment = (payment) => {
  if (!payment) {
    return payment;
  }

  return {
    ...payment,
    id: payment.id || payment._id,
    paymentId: payment.paymentId || payment._id || payment.id,
    transactionId: payment.transactionId || payment.gatewayTxnId,
    status: normalizeStatus(payment.status),
  };
};

const normalizeRefund = (refund) => {
  if (!refund) {
    return refund;
  }

  return {
    ...refund,
    id: refund.id || refund._id,
    refundId: refund.refundId || refund._id || refund.id,
    status: normalizeStatus(refund.status),
  };
};

const paymentApi = {
  initiatePayment: async (paymentData) => {
    try {
      const response = await paymentApiInstance.post('/payments/initiate', paymentData);
      return normalizePayment(unwrapData(response.data));
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  },

  getPaymentById: async (paymentId) => {
    try {
      const response = await paymentApiInstance.get(`/payments/${paymentId}`);
      return normalizePayment(unwrapData(response.data));
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      throw error;
    }
  },

  getPaymentByAppointmentId: async (appointmentId) => {
    try {
      const response = await paymentApiInstance.get(`/payments/appointment/${appointmentId}`);
      return unwrapData(response.data).map(normalizePayment);
    } catch (error) {
      console.error('Error fetching payment by appointment ID:', error);
      throw error;
    }
  },

  createRefund: async (refundData) => {
    try {
      const response = await paymentApiInstance.post('/refunds', refundData);
      return normalizeRefund(unwrapData(response.data));
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  },

  getRefundById: async (refundId) => {
    try {
      const response = await paymentApiInstance.get(`/refunds/${refundId}`);
      return normalizeRefund(unwrapData(response.data));
    } catch (error) {
      console.error('Error fetching refund by ID:', error);
      throw error;
    }
  },

  getAllPayments: async () => {
    try {
      const response = await paymentApiInstance.get('/payments');
      const payload = unwrapData(response.data);
      const payments = Array.isArray(payload?.payments) ? payload.payments : [];
      return payments.map(normalizePayment);
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  },

  addPaymentMethod: async (paymentMethodData) => {
    try {
      const response = await paymentApiInstance.post('/payment-methods', paymentMethodData);
      return unwrapData(response.data);
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  },

  getPaymentMethods: async () => {
    try {
      const response = await paymentApiInstance.get('/payment-methods');
      return unwrapData(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await paymentApiInstance.delete(`/payment-methods/${paymentMethodId}`);
      return unwrapData(response.data);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  },

  setDefaultPaymentMethod: async (paymentMethodId) => {
    try {
      const response = await paymentApiInstance.put(`/payment-methods/${paymentMethodId}/set-default`);
      return unwrapData(response.data);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  },
};

export default paymentApi;
