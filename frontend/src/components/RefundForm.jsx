import React, { useState } from 'react';
import paymentApi from '../services/paymentApi';

const refundReasons = [
  { value: 'APPOINTMENT_CANCELLED', label: 'Appointment cancelled' },
  { value: 'SERVICE_NOT_PROVIDED', label: 'Service not provided' },
  { value: 'DUPLICATE_PAYMENT', label: 'Duplicate payment' },
  { value: 'CUSTOMER_REQUEST', label: 'Customer request' },
  { value: 'OTHER', label: 'Other' },
];

const RefundForm = ({ paymentId, maxAmount }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('CUSTOMER_REQUEST');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setMessageType('');

    if (!paymentId) {
      setMessage('Payment ID is required');
      setMessageType('error');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount');
      setMessageType('error');
      return;
    }

    if (parseFloat(amount) > parseFloat(maxAmount || 0)) {
      setMessage('Refund amount cannot exceed the original payment amount');
      setMessageType('error');
      return;
    }

    if (!reason) {
      setMessage('Please select a reason for the refund');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const refundData = {
        paymentId,
        amount: parseFloat(amount),
        reason,
      };

      const response = await paymentApi.createRefund(refundData);
      const refundId = response.refundId || response.id || response._id || 'N/A';

      setMessage(`Refund request submitted successfully! Refund ID: ${refundId}`);
      setMessageType('success');

      setTimeout(() => {
        setAmount('');
        setReason('CUSTOMER_REQUEST');
        setMessage(null);
      }, 5000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Refund request failed. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;

    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="refund-form">
      <h3>Request Refund</h3>

      <div className="payment-info">
        <div className="info-row">
          <strong>Payment ID:</strong> {paymentId || 'N/A'}
        </div>
        <div className="info-row">
          <strong>Maximum Refund Amount:</strong> ${maxAmount || '0.00'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="refund-amount">Refund Amount ($):</label>
          <input
            id="refund-amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder={`Enter amount up to $${maxAmount || '0.00'}`}
            disabled={isLoading}
            className="form-control"
            step="0.01"
            min="0"
            max={maxAmount || 0}
          />
        </div>

        <div className="form-group">
          <label htmlFor="refund-reason">Reason for Refund:</label>
          <select
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            className="form-control"
          >
            {refundReasons.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Submitting...' : 'Submit Refund Request'}
        </button>
      </form>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="refund-notes">
        <h4>Important Notes:</h4>
        <ul>
          <li>Refund requests are typically processed within 3-5 business days</li>
          <li>The refund will be credited to your original payment method</li>
          <li>You will receive a confirmation email once the refund is processed</li>
          <li>Partial refunds may be subject to processing fees</li>
        </ul>
      </div>

      <style jsx>{`
        .refund-form {
          max-width: 600px;
          margin: 40px auto 0;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border-top: 4px solid #dc3545;
        }

        .refund-form h3 {
          color: #333;
          margin-bottom: 20px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .payment-info {
          margin-bottom: 25px;
          padding: 15px;
          background-color: #fff3cd;
          border-radius: 8px;
          border: 1px solid #ffeaa7;
        }

        .info-row {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .form {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #495057;
        }

        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #dc3545;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #dc3545;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #c82333;
        }

        .btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 20px;
          font-size: 14px;
        }

        .message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .refund-notes {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #dc3545;
        }

        .refund-notes h4 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1rem;
        }

        .refund-notes ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .refund-notes li {
          padding: 8px 0 8px 20px;
          color: #555;
          font-size: 0.9rem;
          position: relative;
          border-bottom: 1px solid #e9ecef;
        }

        .refund-notes li:before {
          content: "!";
          position: absolute;
          left: 0;
        }

        .refund-notes li:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .refund-form {
            margin: 30px 15px 0;
            padding: 20px;
          }

          .refund-form h3 {
            font-size: 1.3rem;
          }

          .payment-info {
            padding: 12px;
          }
        }

        @media (max-width: 480px) {
          .refund-form {
            margin: 20px 10px 0;
            padding: 15px;
          }

          .refund-form h3 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RefundForm;
