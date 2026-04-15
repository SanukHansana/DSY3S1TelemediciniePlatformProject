// PaymentForm.jsx
// Component for payment form with method selection

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import paymentApi from '../services/paymentApi';

const PaymentForm = ({ appointmentId, amount }) => {
  const navigate = useNavigate();
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Available payment methods
  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'net_banking', label: 'Net Banking' },
  ];

  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset message state
    setMessage(null);
    setMessageType('');
    
    // Validate inputs
    if (!appointmentId || !amount) {
      setMessage('Appointment ID and amount are required');
      setMessageType('error');
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Prepare payment data
      const paymentData = {
        appointmentId,
        amount: parseFloat(amount),
        paymentMethod,
      };

      // Call payment API
      const response = await paymentApi.initiatePayment(paymentData);

      // Handle success
      const paymentId = response.paymentId || response.id;
      setMessage(`Payment initiated successfully! Redirecting to payment status...`);
      setMessageType('success');
      
      // Navigate to payment status page after a short delay
      setTimeout(() => {
        if (paymentId) {
          navigate(`/payment/status/${paymentId}`);
        } else {
          navigate('/payment/status');
        }
      }, 2000);
      
    } catch (error) {
      // Handle error
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h3>Payment Details</h3>
      
      {/* Display appointment and amount info */}
      <div className="payment-info">
        <div className="info-row">
          <strong>Appointment ID:</strong> {appointmentId || 'N/A'}
        </div>
        <div className="info-row">
          <strong>Amount:</strong> ${amount || '0.00'}
        </div>
      </div>

      {/* Payment form */}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="payment-method">Payment Method:</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={isLoading}
            className="form-control"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <Link to="/payment/add-method" className="add-method-link">
            + Add New Payment Method
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Processing...' : `Pay $${amount || '0.00'}`}
        </button>
      </form>

      {/* Display messages */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-indicator">
          <p>Processing your payment...</p>
        </div>
      )}

      <style jsx>{`
        .payment-form {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }

        .payment-info {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #e9ecef;
          border-radius: 4px;
        }

        .info-row {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .form {
          margin-bottom: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .message {
          padding: 10px;
          border-radius: 4px;
          margin-top: 15px;
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

        .loading-indicator {
          text-align: center;
          margin-top: 15px;
          color: #6c757d;
          font-style: italic;
        }

        .add-method-link {
          display: inline-block;
          padding: 10px 16px;
          background-color: #f8f9fa;
          border: 2px dashed #667eea;
          border-radius: 8px;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
        }

        .add-method-link:hover {
          background-color: #667eea;
          color: white;
          border-style: solid;
        }

        .add-method-link:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;
