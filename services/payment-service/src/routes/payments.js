import { Router } from 'express';
import {
  initiatePaymentController,
  getPaymentById,
  getPaymentsByAppointment,
  updatePaymentStatus,
  getPaymentHistory
} from '../controllers/paymentController.js';
import { 
  validateRequest, 
  initiatePaymentSchema, 
  updatePaymentStatusSchema,
  validateObjectId 
} from '../middleware/validation.js';
import validateApiKey from '../middleware/auth.js';

const router = Router();

// POST /api/payments/initiate - Initiate a new payment (protected)
router.post('/initiate', validateApiKey, validateRequest(initiatePaymentSchema), initiatePaymentController);

// GET /api/payments/:id - Get payment by ID
router.get('/:id', validateObjectId('id'), getPaymentById);

// GET /api/payments/appointment/:appointmentId - Get payments by appointment ID
router.get('/appointment/:appointmentId', validateObjectId('appointmentId'), getPaymentsByAppointment);

// PUT /api/payments/:id/status - Update payment status (protected)
router.put('/:id/status', validateApiKey, validateObjectId('id'), validateRequest(updatePaymentStatusSchema), updatePaymentStatus);

// GET /api/payments - Get payment history with pagination and filters
router.get('/', getPaymentHistory);

export default router;
