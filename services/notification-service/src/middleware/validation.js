import Joi from 'joi';

const sendNotificationSchema = Joi.object({
  recipientId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  recipientRole: Joi.string().required().valid('PATIENT', 'DOCTOR', 'ADMIN'),
  channel: Joi.string().required().valid('EMAIL', 'SMS'),
  eventType: Joi.string().required().valid(
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_CANCELLED', 
    'APPOINTMENT_REMINDER',
    'PAYMENT_CONFIRMED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
    'CONSULTATION_COMPLETED',
    'PRESCRIPTION_READY',
    'DOCTOR_AVAILABLE'
  ),
  payload: Joi.object().required()
});

const createTemplateSchema = Joi.object({
  eventType: Joi.string().required().valid(
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_CANCELLED', 
    'APPOINTMENT_REMINDER',
    'PAYMENT_CONFIRMED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
    'CONSULTATION_COMPLETED',
    'PRESCRIPTION_READY',
    'DOCTOR_AVAILABLE'
  ),
  channel: Joi.string().required().valid('EMAIL', 'SMS'),
  subject: Joi.string().when('channel', {
    is: 'EMAIL',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  bodyTemplate: Joi.string().required(),
  description: Joi.string().optional()
});

const updateTemplateSchema = Joi.object({
  subject: Joi.string().optional(),
  bodyTemplate: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().optional()
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

export {
  sendNotificationSchema,
  createTemplateSchema,
  updateTemplateSchema,
  validateRequest
};
