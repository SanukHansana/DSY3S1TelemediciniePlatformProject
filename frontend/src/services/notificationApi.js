// notificationApi.js
// API service for notification-service

import axios from 'axios';

// Configurable base URL - can be updated based on environment
const NOTIFICATION_API_BASE_URL = import.meta.env.VITE_NOTIFICATION_API_URL || '/api';

// Create axios instance with default configuration
const notificationApiInstance = axios.create({
  baseURL: NOTIFICATION_API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token if needed
notificationApiInstance.interceptors.request.use(
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
notificationApiInstance.interceptors.response.use(
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

const notificationApi = {
  /**
   * Send a notification (if needed for manual sending)
   * @param {Object} notificationData - Notification information
   * @param {string} notificationData.recipientId - ID of the recipient
   * @param {string} notificationData.eventType - Type of event (appointment_reminder, payment_success, etc.)
   * @param {string} notificationData.channel - Notification channel (email, sms, push)
   * @param {Object} notificationData.data - Additional data for template
   * @returns {Promise<Object>} Notification response with notification ID
   */
  sendNotification: async (notificationData) => {
    try {
      const response = await notificationApiInstance.post('/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  /**
   * Get notification details by notification ID
   * @param {string} notificationId - Unique notification identifier
   * @returns {Promise<Object>} Notification details including status, timestamps, content
   */
  getNotificationById: async (notificationId) => {
    try {
      const response = await notificationApiInstance.get(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      throw error;
    }
  },

  /**
   * Get all notifications for a specific recipient
   * @param {string} recipientId - Unique recipient identifier
   * @param {Object} options - Query options (optional)
   * @param {number} options.limit - Maximum number of notifications to return
   * @param {number} options.offset - Number of notifications to skip
   * @param {string} options.status - Filter by status (sent, failed, pending)
   * @returns {Promise<Object>} List of notifications with pagination info
   */
  getNotificationsByRecipient: async (recipientId, options = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.status) params.append('status', options.status);
      
      const response = await notificationApiInstance.get(
        `/notifications/user/${recipientId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications by recipient:', error);
      throw error;
    }
  },

  /**
   * Create a new notification template
   * @param {Object} templateData - Template information
   * @param {string} templateData.name - Template name
   * @param {string} templateData.eventType - Event type for template
   * @param {string} templateData.channel - Notification channel
   * @param {string} templateData.subject - Template subject (for email)
   * @param {string} templateData.body - Template body with placeholders
   * @param {Object} templateData.variables - Available variables for template
   * @returns {Promise<Object>} Created template with ID
   */
  createTemplate: async (templateData) => {
    try {
      const response = await notificationApiInstance.post('/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  /**
   * Get all notification templates
   * @param {Object} options - Query options (optional)
   * @param {string} options.eventType - Filter by event type
   * @param {string} options.channel - Filter by channel
   * @returns {Promise<Object>} List of notification templates
   */
  getTemplates: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (options.eventType) params.append('eventType', options.eventType);
      if (options.channel) params.append('channel', options.channel);
      
      const response = await notificationApiInstance.get(
        `/templates?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Update an existing notification template
   * @param {string} templateId - Unique template identifier
   * @param {Object} templateData - Updated template information
   * @returns {Promise<Object>} Updated template details
   */
  updateTemplate: async (templateId, templateData) => {
    try {
      const response = await notificationApiInstance.put(`/templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  /**
   * Delete a notification template
   * @param {string} templateId - Unique template identifier
   * @returns {Promise<Object>} Deletion confirmation
   */
  deleteTemplate: async (templateId) => {
    try {
      const response = await notificationApiInstance.delete(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  /**
   * Get template by ID
   * @param {string} templateId - Unique template identifier
   * @returns {Promise<Object>} Template details
   */
  getTemplateById: async (templateId) => {
    try {
      const response = await notificationApiInstance.get(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      throw error;
    }
  },
};

export default notificationApi;
