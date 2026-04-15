import Refund from '../models/Refund.js';
import Payment from '../models/Payment.js';
import { processRefund } from '../services/paymentGatewayService.js';
import { sendPaymentRefundedNotification } from '../services/notificationClient.js';

const createRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    // Validate required fields
    if (!paymentId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'paymentId, amount, and reason are required'
      });
    }

    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if payment is successful (only successful payments can be refunded)
    if (payment.status !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded'
      });
    }

    // Check if refund amount is valid
    if (amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    // Check if refund already exists for this payment
    const existingRefund = await Refund.findOne({ 
      paymentId, 
      status: { $in: ['REQUESTED', 'PROCESSING', 'COMPLETED'] }
    });
    
    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'Refund already exists for this payment',
        data: existingRefund
      });
    }

    // Create refund record with REQUESTED status
    const refund = new Refund({
      paymentId,
      amount,
      reason
    });

    await refund.save();

    // Process refund with gateway
    const gatewayResponse = await processRefund({
      paymentId,
      amount,
      reason
    });

    // Update refund with gateway response
    if (gatewayResponse.success) {
      refund.gatewayRefundId = gatewayResponse.gatewayRefundId;
      refund.status = gatewayResponse.status;
      refund.metadata = gatewayResponse.metadata;
      
      if (gatewayResponse.status === 'COMPLETED') {
        refund.processedAt = new Date();
      }
    } else {
      refund.status = 'REJECTED';
      refund.rejectionReason = gatewayResponse.error;
      refund.metadata = {
        error: gatewayResponse.error,
        errorCode: gatewayResponse.errorCode
      };
    }

    await refund.save();

    // Send notification if refund is completed
    if (refund.status === 'COMPLETED') {
      await sendPaymentRefundedNotification(payment, refund);
    }

    return res.status(201).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund
    });

  } catch (error) {
    console.error('Error creating refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;

    const refund = await Refund.findById(id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    return res.json({
      success: true,
      data: refund
    });

  } catch (error) {
    console.error('Error fetching refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getRefundsByPayment = async (req, res) => {
  try {
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentId is required'
      });
    }

    const refunds = await Refund.find({ paymentId }).sort({ createdAt: -1 });

    if (refunds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No refunds found for this payment'
      });
    }

    return res.json({
      success: true,
      data: refunds
    });

  } catch (error) {
    console.error('Error fetching refunds by payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateRefundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (PROCESSING, COMPLETED, REJECTED) is required'
      });
    }

    const refund = await Refund.findById(id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    // Update refund status
    refund.status = status;
    
    if (status === 'REJECTED' && rejectionReason) {
      refund.rejectionReason = rejectionReason;
    }
    
    if (status === 'COMPLETED' || status === 'REJECTED') {
      refund.processedAt = new Date();
    }

    await refund.save();

    return res.json({
      success: true,
      message: 'Refund status updated successfully',
      data: refund
    });

  } catch (error) {
    console.error('Error updating refund status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getRefundHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, reason } = req.query;

    const query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Refund.countDocuments(query);

    return res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching refund history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  createRefund,
  getRefundById,
  getRefundsByPayment,
  updateRefundStatus,
  getRefundHistory
};
