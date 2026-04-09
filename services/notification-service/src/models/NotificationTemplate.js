import mongoose from 'mongoose';

const notificationTemplateSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'PRESCRIPTION_READY', 'DOCTOR_AVAILABLE']
  },
  channel: {
    type: String,
    required: true,
    enum: ['EMAIL', 'SMS']
  },
  subject: {
    type: String,
    required: function() {
      return this.channel === 'EMAIL';
    }
  },
  bodyTemplate: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to ensure unique active templates per event type and channel
notificationTemplateSchema.index({ eventType: 1, channel: 1 }, { unique: true });

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

export default NotificationTemplate;
