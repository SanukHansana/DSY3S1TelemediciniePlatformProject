import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const paymentMethodValues = [
  'CREDIT_CARD',
  'DEBIT_CARD',
  'NET_BANKING',
  'UPI',
  'WALLET'
];

const refundReasonValues = [
  'APPOINTMENT_CANCELLED',
  'SERVICE_NOT_PROVIDED',
  'DUPLICATE_PAYMENT',
  'CUSTOMER_REQUEST',
  'OTHER'
];
const savedPaymentMethodTypeValues = ['CREDIT_CARD', 'DEBIT_CARD'];

const uppercaseEnum = (allowedValues) =>
  Joi.string()
    .trim()
    .custom((value, helpers) => {
      const normalized = value.toUpperCase();

      if (!allowedValues.includes(normalized)) {
        return helpers.error('any.only');
      }

      return normalized;
    }, 'uppercase enum normalization');

const initiatePaymentSchema = Joi.object({
  appointmentId: Joi.string().required().pattern(objectIdPattern),
  patientId: Joi.string().optional().pattern(objectIdPattern),
  savedPaymentMethodId: Joi.string().required().pattern(objectIdPattern),
  amount: Joi.number().required().min(1),
  currency: uppercaseEnum(['USD', 'EUR', 'GBP', 'INR']).default('USD')
});

const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().required().valid('SUCCESS', 'FAILED', 'REFUNDED')
});

const createRefundSchema = Joi.object({
  paymentId: Joi.string().required().pattern(objectIdPattern),
  amount: Joi.number().required().min(1),
  reason: uppercaseEnum(refundReasonValues).required()
});

const savePaymentMethodSchema = Joi.object({
  type: uppercaseEnum(savedPaymentMethodTypeValues).required(),
  cardNumber: Joi.string().trim().pattern(/^\d{16}$/).required(),
  cardholderName: Joi.string().trim().min(2).required(),
  expiryMonth: Joi.string().trim().pattern(/^(0[1-9]|1[0-2])$/).required(),
  expiryYear: Joi.string().trim().pattern(/^\d{4}$/).required(),
  cvv: Joi.string().trim().pattern(/^\d{3,4}$/).required(),
  billingAddress: Joi.object({
    street: Joi.string().allow('').default(''),
    city: Joi.string().allow('').default(''),
    state: Joi.string().allow('').default(''),
    zipCode: Joi.string().allow('').default(''),
    country: Joi.string().allow('').default('US')
  }).default({}),
  isDefault: Joi.boolean().default(false)
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
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    req.body = value;
    
    next();
  };
};

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.query[paramName];
    
    if (!id || !objectIdPattern.test(id)) {
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
  savePaymentMethodSchema,
  updateRefundStatusSchema,
  validateRequest,
  validateObjectId
};
