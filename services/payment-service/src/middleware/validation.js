import Joi from 'joi';

const initiatePaymentSchema = Joi.object({
  appointmentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  patientId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  amount: Joi.number().required().min(1),
  currency: Joi.string().optional().valid('USD', 'EUR', 'GBP', 'INR').default('USD'),
  paymentMethod: Joi.string().required().valid('CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'UPI', 'WALLET')
});

const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().required().valid('SUCCESS', 'FAILED', 'REFUNDED')
});

const createRefundSchema = Joi.object({
  paymentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  amount: Joi.number().required().min(1),
  reason: Joi.string().required().valid('APPOINTMENT_CANCELLED', 'SERVICE_NOT_PROVIDED', 'DUPLICATE_PAYMENT', 'CUSTOMER_REQUEST', 'OTHER')
});

const updateRefundStatusSchema = Joi.object({
  status: Joi.string().required().valid('PROCESSING', 'COMPLETED', 'REJECTED'),
  rejectionReason: Joi.string().when('status', {
    is: 'REJECTED',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.query[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

export {
  initiatePaymentSchema,
  updatePaymentStatusSchema,
  createRefundSchema,
  updateRefundStatusSchema,
  validateRequest,
  validateObjectId
};
