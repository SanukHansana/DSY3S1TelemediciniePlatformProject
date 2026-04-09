import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientRole: {
    type: String,
    required: true,
    enum: ['PATIENT', 'DOCTOR', 'ADMIN']
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Patient', 'Doctor', 'Admin']
  },
  channel: {
    type: String,
    required: true,
    enum: ['EMAIL', 'SMS']
  },
  eventType: {
    type: String,
    required: true,
    enum: ['APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PRESCRIPTION_READY', 'DOCTOR_AVAILABLE']
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
    default: 'PENDING'
  },
  externalMsgId: {
    type: String
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ eventType: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
