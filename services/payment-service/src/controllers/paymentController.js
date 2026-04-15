import Payment from '../models/Payment.js';
import { initiatePayment, simulateWebhook } from '../services/paymentGatewayService.js';
import { 
  sendPaymentSuccessNotification, 
  sendPaymentFailedNotification 
} from '../services/notificationClient.js';

const initiatePaymentController = async (req, res) => {
  try {
    const { appointmentId, patientId, amount, currency = 'USD', paymentMethod } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, patientId, amount, and paymentMethod are required'
      });
    }

    // Check if payment already exists for this appointment
    const existingPayment = await Payment.findOne({ appointmentId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already initiated for this appointment',
        data: existingPayment
      });
    }

    // Create payment record with PENDING status
    const payment = new Payment({
      appointmentId,
      patientId,
      gateway: 'MOCK',
      gatewayTxnId: `pending_${Date.now()}`,
      amount,
      currency: currency.toUpperCase(),
      paymentMethod,
      status: 'PENDING'
    });

    await payment.save();

    // Initiate payment with gateway
    const gatewayResponse = await initiatePayment({
      amount,
      currency,
      paymentMethod,
      appointmentId,
      patientId
    });

    // Update payment with gateway response
    if (gatewayResponse.success) {
      payment.gatewayTxnId = gatewayResponse.gatewayTxnId;
      payment.status = gatewayResponse.status;
      payment.metadata = gatewayResponse.metadata;
      
      if (gatewayResponse.status === 'SUCCESS') {
        payment.completedAt = new Date();
      }
    } else {
      payment.status = 'FAILED';
      payment.metadata = {
        error: gatewayResponse.error,
        errorCode: gatewayResponse.errorCode
      };
    }

    await payment.save();

    // Send notifications based on payment status
    if (payment.status === 'SUCCESS') {
      await sendPaymentSuccessNotification(payment);
    } else if (payment.status === 'FAILED') {
      await sendPaymentFailedNotification(payment);
    }

    // Simulate webhook notification
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
