import Payment from '../models/Payment.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { initiatePayment, simulateWebhook } from '../services/paymentGatewayService.js';
import { 
  sendPaymentSuccessNotification, 
  sendPaymentFailedNotification 
} from '../services/notificationClient.js';
import { updateAppointmentStatus } from '../services/appointmentClient.js';

const initiatePaymentController = async (req, res) => {
  try {
    const {
      appointmentId,
      patientId: requestedPatientId,
      amount,
      currency = 'USD',
      savedPaymentMethodId
    } = req.body;
    const isUserRequest = req.authType === 'user';
    let patientId = req.user?.role === 'patient'
      ? req.user.id
      : requestedPatientId || req.user?.id;

    // Validate required fields
    if (!appointmentId || !patientId || !amount || !savedPaymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, patientId, amount, and savedPaymentMethodId are required'
      });
    }

    if (isUserRequest && !['patient', 'admin'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only patients or admins can initiate payments'
      });
    }

    if (
      req.user?.role === 'patient' &&
      requestedPatientId &&
      requestedPatientId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Patients can only initiate payments for their own account'
      });
    }

    const savedPaymentMethod = await PaymentMethod.findById(savedPaymentMethodId);

    if (!savedPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Saved payment method not found'
      });
    }

    if (
      isUserRequest &&
      req.user?.role === 'patient' &&
      String(savedPaymentMethod.userId) !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay with your own saved payment methods'
      });
    }

    if (
      requestedPatientId &&
      String(savedPaymentMethod.userId) !== String(requestedPatientId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'The saved payment method does not belong to the selected patient'
      });
    }

    patientId = String(savedPaymentMethod.userId);

    // Check if payment already exists for this appointment
    const existingPayment = await Payment.findOne({ appointmentId });
    if (existingPayment && existingPayment.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Payment already initiated for this appointment',
        data: existingPayment
      });
    }

    const payment = existingPayment && existingPayment.status === 'FAILED'
      ? existingPayment
      : new Payment();

    payment.appointmentId = appointmentId;
    payment.patientId = patientId;
    payment.gateway = 'MANUAL';
    payment.gatewayTxnId = `pending_${Date.now()}`;
    payment.amount = amount;
    payment.currency = currency.toUpperCase();
    payment.paymentMethod = savedPaymentMethod.type;
    payment.status = 'PENDING';
    payment.completedAt = undefined;
    payment.metadata = {
      sourceType: 'saved_payment_method',
      paymentMethodId: savedPaymentMethod._id,
      maskedCard: `**** **** **** ${savedPaymentMethod.last4}`,
      brand: savedPaymentMethod.brand
    };

    await payment.save();

    const gatewayResponse = await initiatePayment({
      amount,
      currency,
      paymentMethod: savedPaymentMethod.type,
      appointmentId,
      patientId,
      paymentSource: {
        type: 'saved_payment_method',
        paymentMethodId: savedPaymentMethod._id,
        brand: savedPaymentMethod.brand,
        last4: savedPaymentMethod.last4,
        expiryMonth: savedPaymentMethod.expiryMonth,
        expiryYear: savedPaymentMethod.expiryYear
      }
    });

    if (gatewayResponse.success) {
      payment.gatewayTxnId = gatewayResponse.gatewayTxnId;
      payment.status = gatewayResponse.status;
      payment.metadata = {
        ...payment.metadata,
        ...gatewayResponse.metadata
      };
      
      if (gatewayResponse.status === 'SUCCESS') {
        payment.completedAt = new Date();
      }
    } else {
      payment.status = 'FAILED';
      payment.metadata = {
        ...payment.metadata,
        error: gatewayResponse.error,
        errorCode: gatewayResponse.errorCode
      };
    }

    await payment.save();

    // Send notifications based on payment status
    if (payment.status === 'SUCCESS') {
      await updateAppointmentStatus(payment.appointmentId, 'scheduled');
      await sendPaymentSuccessNotification(payment);
    } else if (payment.status === 'FAILED') {
      await updateAppointmentStatus(payment.appointmentId, 'payment_failed');
      await sendPaymentFailedNotification(payment);
    }

    if (gatewayResponse.success) {
      simulateWebhook({
        gatewayTxnId: payment.gatewayTxnId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getPaymentsByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const payments = await Payment.find({ appointmentId });

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payments found for this appointment'
      });
    }

    return res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching payments by appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['SUCCESS', 'FAILED', 'REFUNDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (SUCCESS, FAILED, REFUNDED) is required'
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment status
    payment.status = status;
    
    if (status === 'SUCCESS' || status === 'FAILED') {
      payment.completedAt = new Date();
    }

    await payment.save();

    if (status === 'SUCCESS') {
      await updateAppointmentStatus(payment.appointmentId, 'scheduled');
    } else if (status === 'FAILED') {
      await updateAppointmentStatus(payment.appointmentId, 'payment_failed');
    }

    // Simulate webhook notification
    simulateWebhook({
      gatewayTxnId: payment.gatewayTxnId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency
    });

    return res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { patientId } = req.query;
    const { page = 1, limit = 10, status, gateway } = req.query;

    const query = {};
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Payment.countDocuments(query);

    return res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  initiatePaymentController,
  getPaymentById,
  getPaymentsByAppointment,
  updatePaymentStatus,
  getPaymentHistory
};
