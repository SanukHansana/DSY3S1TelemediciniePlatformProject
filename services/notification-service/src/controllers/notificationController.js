import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import { getDefaultTemplate, processTemplate } from '../services/templateService.js';
import { sendEmail, sendSMS } from '../services/notificationService.js';

const getFirstValue = (payload, paths) => {
  for (const path of paths) {
    const value = path
      .split('.')
      .reduce((current, key) => current?.[key], payload);

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const resolveRecipientEmail = (payload) =>
  getFirstValue(payload, [
    'email',
    'recipient.email',
    'patient.email',
    'doctor.email'
  ]);

const resolveRecipientPhone = (payload) =>
  getFirstValue(payload, [
    'phone',
    'recipient.phone',
    'patient.phone',
    'doctor.phone'
  ]);

const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientRole, channel, eventType, payload } = req.body;

    if (!recipientId || !recipientRole || !channel || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'recipientId, recipientRole, channel, and eventType are required'
      });
    }

    const template = await NotificationTemplate.findOne({
      eventType,
      channel,
      isActive: true
    }) || getDefaultTemplate(eventType, channel);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `No active template found for ${eventType} via ${channel}`
      });
    }

    const { subject, body } = processTemplate(template, payload || {});

    const notification = new Notification({
      recipientId,
      recipientRole,
      recipientModel:
        recipientRole === 'PATIENT'
          ? 'Patient'
          : recipientRole === 'DOCTOR'
          ? 'Doctor'
          : 'Admin',
      channel,
      eventType,
      payload,
      status: 'PENDING'
    });

    await notification.save();

    let result;
    if (channel === 'EMAIL') {
      result = await sendEmail(resolveRecipientEmail(payload), subject, body);
    } else if (channel === 'SMS') {
      result = await sendSMS(resolveRecipientPhone(payload), body);
    } else {
      result = {
        success: false,
        error: 'Unsupported notification channel'
      };
    }

    if (result.success) {
      notification.status = 'SENT';
      notification.externalMsgId = result.messageId;
      notification.sentAt = new Date();
    } else {
      notification.status = 'FAILED';
      notification.errorMessage = result.error;
    }

    await notification.save();

    return res.status(201).json({
      success: true,
      message: 'Notification processed successfully',
      data: {
        notificationId: notification._id,
        status: notification.status,
        externalMsgId: notification.externalMsgId
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getNotificationsByRecipient = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 10, status, eventType } = req.query;

    const query = { recipientId };
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Notification.countDocuments(query);

    return res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveredAt } = req.body;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (status !== undefined) notification.status = status;
    if (deliveredAt) notification.deliveredAt = new Date(deliveredAt);

    await notification.save();

    return res.json({
      success: true,
      message: 'Notification status updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  sendNotification,
  getNotificationById,
  getNotificationsByRecipient,
  updateNotificationStatus
};
