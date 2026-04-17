import { Router } from 'express';
import authenticateRequest from '../middleware/auth.js';
import {
  validateObjectId,
  validateRequest,
  savePaymentMethodSchema
} from '../middleware/validation.js';
import {
  createPaymentMethod,
  listMyPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod
} from '../controllers/paymentMethodController.js';

const router = Router();

router.post('/', authenticateRequest, validateRequest(savePaymentMethodSchema), createPaymentMethod);
router.get('/', authenticateRequest, listMyPaymentMethods);
router.delete('/:id', authenticateRequest, validateObjectId('id'), deletePaymentMethod);
router.put('/:id/set-default', authenticateRequest, validateObjectId('id'), setDefaultPaymentMethod);

export default router;
