import PaymentMethod from '../models/PaymentMethod.js';

const ensureUserRequest = (req, res) => {
  if (req.authType !== 'user' || !req.user?.id) {
    res.status(403).json({
      success: false,
      message: 'A logged-in user account is required'
    });
    return false;
  }

  return true;
};

const detectCardBrand = (cardNumber) => {
  if (cardNumber.startsWith('4')) {
    return 'Visa';
  }

  if (/^5[1-5]/.test(cardNumber)) {
    return 'Mastercard';
  }

  if (/^3[47]/.test(cardNumber)) {
    return 'American Express';
  }

  if (/^6(?:011|5)/.test(cardNumber)) {
    return 'Discover';
  }

  return 'Card';
};

const toPaymentMethod = (paymentMethod) => ({
  _id: paymentMethod._id,
  userId: paymentMethod.userId,
  type: paymentMethod.type,
  brand: paymentMethod.brand,
  last4: paymentMethod.last4,
  cardholderName: paymentMethod.cardholderName,
  expiryMonth: paymentMethod.expiryMonth,
  expiryYear: paymentMethod.expiryYear,
  billingAddress: paymentMethod.billingAddress,
  isDefault: paymentMethod.isDefault,
  maskedNumber: `**** **** **** ${paymentMethod.last4}`,
  createdAt: paymentMethod.createdAt,
  updatedAt: paymentMethod.updatedAt
});

const isExpiredCard = (expiryMonth, expiryYear) => {
  const month = Number(expiryMonth);
  const year = Number(expiryYear);

  if (!month || !year) {
    return true;
  }

  const currentDate = new Date();
  const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);

  return expiryDate < currentDate;
};

export const createPaymentMethod = async (req, res) => {
  if (!ensureUserRequest(req, res)) {
    return;
  }

  const {
    type,
    cardNumber,
    cardholderName,
    expiryMonth,
    expiryYear,
    billingAddress = {},
    isDefault = false
  } = req.body;

  if (isExpiredCard(expiryMonth, expiryYear)) {
    return res.status(400).json({
      success: false,
      message: 'The payment method is expired'
    });
  }

  const existingCount = await PaymentMethod.countDocuments({ userId: req.user.id });
  const shouldBeDefault = isDefault || existingCount === 0;

  if (shouldBeDefault) {
    await PaymentMethod.updateMany(
      { userId: req.user.id, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const paymentMethod = await PaymentMethod.create({
    userId: req.user.id,
    type,
    brand: detectCardBrand(cardNumber),
    last4: cardNumber.slice(-4),
    cardholderName: cardholderName.trim(),
    expiryMonth,
    expiryYear,
    billingAddress,
    isDefault: shouldBeDefault
  });

  return res.status(201).json({
    success: true,
    message: 'Payment method added successfully',
    data: toPaymentMethod(paymentMethod.toObject())
  });
};

export const listMyPaymentMethods = async (req, res) => {
  if (!ensureUserRequest(req, res)) {
    return;
  }

  const paymentMethods = await PaymentMethod.find({ userId: req.user.id })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  return res.json({
    success: true,
    data: paymentMethods.map(toPaymentMethod)
  });
};

export const deletePaymentMethod = async (req, res) => {
  if (!ensureUserRequest(req, res)) {
    return;
  }

  const paymentMethod = await PaymentMethod.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!paymentMethod) {
    return res.status(404).json({
      success: false,
      message: 'Payment method not found'
    });
  }

  if (paymentMethod.isDefault) {
    const fallbackMethod = await PaymentMethod.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (fallbackMethod) {
      fallbackMethod.isDefault = true;
      await fallbackMethod.save();
    }
  }

  return res.json({
    success: true,
    message: 'Payment method deleted successfully'
  });
};

export const setDefaultPaymentMethod = async (req, res) => {
  if (!ensureUserRequest(req, res)) {
    return;
  }

  const paymentMethod = await PaymentMethod.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!paymentMethod) {
    return res.status(404).json({
      success: false,
      message: 'Payment method not found'
    });
  }

  await PaymentMethod.updateMany(
    { userId: req.user.id, isDefault: true },
    { $set: { isDefault: false } }
  );

  paymentMethod.isDefault = true;
  await paymentMethod.save();

  return res.json({
    success: true,
    message: 'Default payment method updated successfully',
    data: toPaymentMethod(paymentMethod.toObject())
  });
};
