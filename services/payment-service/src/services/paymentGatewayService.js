import { v4 as uuidv4 } from 'uuid';

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

export const initiatePayment = async (paymentData) => {
  try {
    const {
      amount,
      currency,
      paymentMethod,
      paymentSource
    } = paymentData;
    const gatewayTxnId = `txn_${uuidv4()}`;
    await new Promise(resolve => setTimeout(resolve, 350));

    if (!amount || Number(amount) <= 0) {
      return {
        success: false,
        gatewayTxnId,
        status: 'FAILED',
        error: 'Invalid payment amount',
        errorCode: 'INVALID_AMOUNT',
        metadata: {
          processedAt: new Date().toISOString(),
          gateway: 'MANUAL'
        }
      };
    }

    if (
      paymentSource?.expiryMonth &&
      paymentSource?.expiryYear &&
      isExpiredCard(paymentSource.expiryMonth, paymentSource.expiryYear)
    ) {
      return {
        success: false,
        gatewayTxnId,
        status: 'FAILED',
        error: 'The selected payment method is expired',
        errorCode: 'CARD_EXPIRED',
        metadata: {
          processedAt: new Date().toISOString(),
          gateway: 'MANUAL'
        }
      };
    }

    return {
      success: true,
      gatewayTxnId,
      status: 'SUCCESS',
      amount,
      currency,
      paymentMethod,
      message: 'Payment processed successfully',
      metadata: {
        processedAt: new Date().toISOString(),
        gateway: 'MANUAL',
        sourceType: paymentSource?.type || 'saved_payment_method',
        brand: paymentSource?.brand || null,
        maskedCard: paymentSource?.last4
          ? `**** **** **** ${paymentSource.last4}`
          : null
      }
    };
  } catch (error) {
    console.error('Payment processor error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'PROCESSOR_ERROR'
    };
  }
};

export const processRefund = async (refundData) => {
  try {
    const { paymentId, amount, reason } = refundData;
    const gatewayRefundId = `refund_${uuidv4()}`;
    await new Promise(resolve => setTimeout(resolve, 400));

    if (!paymentId || !amount || Number(amount) <= 0) {
      return {
        success: false,
        gatewayRefundId,
        status: 'REJECTED',
        error: 'Invalid refund request',
        errorCode: 'INVALID_REFUND_REQUEST',
        metadata: {
          processedAt: new Date().toISOString(),
          gateway: 'MANUAL'
        }
      };
    }

    return {
      success: true,
      gatewayRefundId,
      status: 'COMPLETED',
      amount,
      reason,
      message: 'Refund processed successfully',
      metadata: {
        processedAt: new Date().toISOString(),
        gateway: 'MANUAL',
        processor: 'LOCAL'
      }
    };
  } catch (error) {
    console.error('Refund processor error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'PROCESSOR_ERROR'
    };
  }
};

export const getPaymentStatus = async (gatewayTxnId) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      gatewayTxnId,
      status: 'SUCCESS',
      metadata: {
        checkedAt: new Date().toISOString(),
        gateway: 'MANUAL'
      }
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      gatewayTxnId,
      status: 'UNKNOWN',
      error: error.message
    };
  }
};

export const simulateWebhook = async (paymentData) => {
  try {
    const webhookPayload = {
      event: 'payment.completed',
      data: {
        gatewayTxnId: paymentData.gatewayTxnId,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: paymentData.currency,
        timestamp: new Date().toISOString()
      },
      signature: `webhook_${Math.random().toString(36).substr(2, 32)}`
    };
    
    console.log('=== PAYMENT EVENT ===');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
    console.log('=====================');
    
    return {
      success: true,
      webhookPayload
    };
  } catch (error) {
    console.error('Webhook simulation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
