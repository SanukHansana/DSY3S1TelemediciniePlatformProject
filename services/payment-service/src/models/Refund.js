import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Payment'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: ['APPOINTMENT_CANCELLED', 'SERVICE_NOT_PROVIDED', 'DUPLICATE_PAYMENT', 'CUSTOMER_REQUEST', 'OTHER']
  },
  status: {
    type: String,
    required: true,
    enum: ['REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED'],
    default: 'REQUESTED'
  },
  gatewayRefundId: {
    type: String,
    sparse: true,
    unique: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
refundSchema.index({ paymentId: 1 });
refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ requestedAt: -1 });

// Pre-save middleware to set processedAt when status changes to COMPLETED or REJECTED
refundSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if ((this.status === 'COMPLETED' || this.status === 'REJECTED') && !this.processedAt) {
      this.processedAt = new Date();
    }
    
    // If refund is completed, update the payment status to REFUNDED
    if (this.status === 'COMPLETED') {
      this.constructor.model('Payment').findByIdAndUpdate(
        this.paymentId,
        { status: 'REFUNDED' },
        { new: true }
      ).exec().catch(err => console.error('Error updating payment status:', err));
    }
  }
  next();
});

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
