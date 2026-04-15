// PaymentStatusCard.jsx
// Component for displaying payment details

import React from 'react';

const PaymentStatusCard = ({ payment }) => {
  // If no payment data, show placeholder
  if (!payment) {
    return (
      <div className="payment-status-card">
        <div className="card-header">
          <h3>Payment Details</h3>
        </div>
        <div className="card-content">
          <p className="no-data">No payment data available</p>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'status-success';
      case 'pending':
      case 'processing':
        return 'status-pending';
      case 'failed':
      case 'cancelled':
        return 'status-failed';
      default:
        return 'status-unknown';
    }
  };

  // Format amount
  const formatAmount = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="payment-status-card">
      <div className="card-header">
        <h3>Payment Details</h3>
        <div className={`payment-status ${getStatusClass(payment.status)}`}>
          {payment.status || 'Unknown'}
        </div>
      </div>

      <div className="card-content">
        <div className="payment-info-grid">
          {/* Payment ID */}
          <div className="info-row">
            <span className="label">Payment ID:</span>
            <span className="value">{payment.paymentId || payment.id || 'N/A'}</span>
          </div>

          {/* Appointment ID */}
          <div className="info-row">
            <span className="label">Appointment ID:</span>
            <span className="value">{payment.appointmentId || 'N/A'}</span>
          </div>

          {/* Patient ID */}
          <div className="info-row">
            <span className="label">Patient ID:</span>
            <span className="value">{payment.patientId || 'N/A'}</span>
          </div>

          {/* Amount */}
          <div className="info-row">
            <span className="label">Amount:</span>
            <span className="value amount">{formatAmount(payment.amount)}</span>
          </div>

          {/* Payment Gateway */}
          <div className="info-row">
            <span className="label">Gateway:</span>
            <span className="value">{payment.gateway || 'N/A'}</span>
          </div>

          {/* Payment Method */}
          <div className="info-row">
            <span className="label">Payment Method:</span>
            <span className="value">{payment.paymentMethod || 'N/A'}</span>
          </div>

          {/* Transaction ID */}
          {payment.transactionId && (
            <div className="info-row">
              <span className="label">Transaction ID:</span>
              <span className="value">{payment.transactionId}</span>
            </div>
          )}

          {/* Initiated At */}
          <div className="info-row">
            <span className="label">Initiated:</span>
            <span className="value">{formatDate(payment.initiatedAt)}</span>
          </div>

          {/* Completed At */}
          <div className="info-row">
            <span className="label">Completed:</span>
            <span className="value">{formatDate(payment.completedAt)}</span>
          </div>
        </div>

        {/* Additional Information */}
        {payment.errorMessage && (
          <div className="error-message">
            <strong>Error:</strong> {payment.errorMessage}
          </div>
        )}

        {payment.failureReason && (
          <div className="failure-reason">
            <strong>Failure Reason:</strong> {payment.failureReason}
          </div>
        )}
      </div>

      <style jsx>{`
        .payment-status-card {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .payment-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-success {
          background-color: #28a745;
        }

        .status-pending {
          background-color: #ffc107;
          color: #333;
        }

        .status-failed {
          background-color: #dc3545;
        }

        .status-unknown {
          background-color: #6c757d;
        }

        .card-content {
          padding: 30px;
        }

        .payment-info-grid {
          display: grid;
          gap: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .info-row:hover {
          background-color: #e9ecef;
        }

        .label {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
        }

        .value {
          color: #212529;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .value.amount {
          font-weight: 700;
          color: #28a745;
          font-size: 1.1rem;
        }

        .no-data {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 40px 20px;
        }

        .error-message,
        .failure-reason {
          margin-top: 20px;
          padding: 15px;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .failure-reason {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .card-content {
            padding: 20px;
          }

          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .label {
            font-size: 0.85rem;
          }

          .value {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .card-header {
            padding: 20px;
          }

          .card-header h3 {
            font-size: 1.3rem;
          }

          .card-content {
            padding: 15px;
          }

          .info-row {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentStatusCard;
