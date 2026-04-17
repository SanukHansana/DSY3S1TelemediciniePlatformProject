import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Appointment'
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  gateway: {
    type: String,
    required: true,
    enum: ['STRIPE', 'PAYPAL', 'RAZORPAY', 'MOCK', 'MANUAL']
  },
  gatewayTxnId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'UPI', 'WALLET']
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ initiatedAt: -1 });

// Pre-save middleware to set completedAt when status changes to SUCCESS or FAILED
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && 
      (this.status === 'SUCCESS' || this.status === 'FAILED') && 
      !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
