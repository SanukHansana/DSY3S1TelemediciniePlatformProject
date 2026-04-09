import { Router } from 'express';
import {
  sendNotification,
  getNotificationById,
  getNotificationsByRecipient,
  updateNotificationStatus
} from '../controllers/notificationController.js';
import { validateRequest, sendNotificationSchema } from '../middleware/validation.js';
import validateApiKey from '../middleware/auth.js';

const router = Router();

// POST /api/notifications/send - Send a notification (protected)
router.post('/send', validateApiKey, validateRequest(sendNotificationSchema), sendNotification);

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', getNotificationById);

// GET /api/notifications/user/:recipientId - Get notifications for a specific user
router.get('/user/:recipientId', getNotificationsByRecipient);

// PUT /api/notifications/:id - Update notification status
router.put('/:id', updateNotificationStatus);

export default router;
