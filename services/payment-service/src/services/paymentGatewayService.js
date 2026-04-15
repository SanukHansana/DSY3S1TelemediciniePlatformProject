import { v4 as uuidv4 } from 'uuid';

// Mock payment gateway service
export const initiatePayment = async (paymentData) => {
  try {
    // Simulate payment gateway processing
    const { amount, currency, paymentMethod, appointmentId, patientId } = paymentData;
    
    // Generate a mock transaction ID
    const gatewayTxnId = `txn_${uuidv4()}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success/failure logic (90% success rate for testing)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
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
          gateway: 'MOCK',
          authCode: `AUTH_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }
      };
    } else {
      return {
        success: false,
        gatewayTxnId,
        status: 'FAILED',
        error: 'Payment declined by gateway',
        errorCode: 'GATEWAY_DECLINED',
        metadata: {
          processedAt: new Date().toISOString(),
          gateway: 'MOCK',
          declineReason: 'Insufficient funds'
        }
      };
    }
  } catch (error) {
    console.error('Payment gateway error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'GATEWAY_ERROR'
    };
  }
};

// Mock refund processing
export const processRefund = async (refundData) => {
  try {
    const { paymentId, amount, reason } = refundData;
    
    // Generate mock refund ID
    const gatewayRefundId = `refund_${uuidv4()}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock success/failure logic (95% success rate for refunds)
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      return {
        success: true,
        gatewayRefundId,
        status: 'COMPLETED',
        amount,
        reason,
        message: 'Refund processed successfully',
        metadata: {
          processedAt: new Date().toISOString(),
          gateway: 'MOCK',
          refundCode: `REF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }
      };
    } else {
      return {
        success: false,
        gatewayRefundId,
        status: 'REJECTED',
        error: 'Refund rejected by gateway',
        errorCode: 'REFUND_REJECTED',
        metadata: {
          processedAt: new Date().toISOString(),
          gateway: 'MOCK',
          rejectionReason: 'Refund period expired'
        }
      };
    }
  } catch (error) {
    console.error('Refund gateway error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'GATEWAY_ERROR'
    };
  }
};

// Mock payment status check
export const getPaymentStatus = async (gatewayTxnId) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock status response
    const statuses = ['SUCCESS', 'FAILED', 'PENDING'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      gatewayTxnId,
      status: randomStatus,
      metadata: {
        checkedAt: new Date().toISOString(),
        gateway: 'MOCK'
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

// Mock webhook simulation
export const simulateWebhook = async (paymentData) => {
  try {
    // Simulate webhook notification
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
    
    console.log('=== MOCK WEBHOOK SENT ===');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
    console.log('========================');
    
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
