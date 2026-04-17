import { Router } from 'express';
import {
  createRefund,
  getRefundById,
  getRefundsByPayment,
  updateRefundStatus,
  getRefundHistory
} from '../controllers/refundController.js';
import { 
  validateRequest, 
  createRefundSchema, 
  updateRefundStatusSchema,
  validateObjectId 
} from '../middleware/validation.js';
import authenticateRequest from '../middleware/auth.js';

const router = Router();

// POST /api/refunds - Create a new refund (protected)
router.post('/', authenticateRequest, validateRequest(createRefundSchema), createRefund);

// GET /api/refunds/history - Get refund history with pagination and filters
router.get('/history', getRefundHistory);

// GET /api/refunds/:id - Get refund by ID
router.get('/:id', validateObjectId('id'), getRefundById);

// GET /api/refunds - Get refunds by payment ID or refund history
router.get('/', getRefundsByPayment);

// PUT /api/refunds/:id/status - Update refund status (protected)
router.put('/:id/status', authenticateRequest, validateObjectId('id'), validateRequest(updateRefundStatusSchema), updateRefundStatus);

export default router;
