import mongoose from 'mongoose';

const billingAddressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    zipCode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'US'
    }
  },
  { _id: false }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['CREDIT_CARD', 'DEBIT_CARD']
    },
    brand: {
      type: String,
      default: 'Card'
    },
    last4: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 4
    },
    cardholderName: {
      type: String,
      required: true,
      trim: true
    },
    expiryMonth: {
      type: String,
      required: true
    },
    expiryYear: {
      type: String,
      required: true
    },
    billingAddress: {
      type: billingAddressSchema,
      default: () => ({})
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

paymentMethodSchema.index({ userId: 1, isDefault: -1, createdAt: -1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
