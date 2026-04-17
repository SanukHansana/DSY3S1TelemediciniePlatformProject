import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import paymentApi from '../services/paymentApi';

const PaymentForm = ({ appointmentId, amount, patientId }) => {
  const navigate = useNavigate();
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setIsLoadingMethods(true);
        const methods = await paymentApi.getPaymentMethods();
        const list = Array.isArray(methods) ? methods : [];
        setSavedPaymentMethods(list);

        const defaultMethod =
          list.find((entry) => entry.isDefault) || list[0] || null;
        setSelectedPaymentMethodId(defaultMethod?._id || '');
      } catch (error) {
        setSavedPaymentMethods([]);
        setMessage(
          error.response?.data?.message ||
            error.message ||
            'Could not load saved payment methods.'
        );
        setMessageType('error');
      } finally {
        setIsLoadingMethods(false);
      }
    };

    loadPaymentMethods();
  }, []);

  const formatPaymentMethod = (paymentMethod) => {
    const label =
      paymentMethod.type === 'DEBIT_CARD' ? 'Debit Card' : 'Credit Card';
    const brandPrefix = paymentMethod.brand ? `${paymentMethod.brand} ` : '';

    return `${brandPrefix}${label} - **** ${paymentMethod.last4} (${paymentMethod.expiryMonth}/${paymentMethod.expiryYear})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setMessageType('');

    if (!appointmentId || !patientId || !amount) {
      setMessage('Appointment ID, patient ID, and amount are required');
      setMessageType('error');
      return;
    }

    if (!selectedPaymentMethodId) {
      setMessage('Add a payment method first before paying for this appointment.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const paymentData = {
        appointmentId,
        patientId,
        amount: parseFloat(amount),
        savedPaymentMethodId: selectedPaymentMethodId,
      };

      const response = await paymentApi.initiatePayment(paymentData);
      const createdPaymentId = response.paymentId || response.id || response._id;

      setMessage('Payment initiated successfully! Redirecting to payment status...');
      setMessageType('success');

      setTimeout(() => {
        if (createdPaymentId) {
          navigate(`/payment/status/${createdPaymentId}`);
        } else {
          navigate('/payment/status');
        }
      }, 2000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Payment failed. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h3>Payment Details</h3>

      <div className="payment-info">
        <div className="info-row">
          <strong>Appointment ID:</strong> {appointmentId || 'N/A'}
        </div>
        <div className="info-row">
          <strong>Patient ID:</strong> {patientId || 'N/A'}
        </div>
        <div className="info-row">
          <strong>Amount:</strong> ${amount || '0.00'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="saved-payment-method">Saved Payment Method:</label>
          <select
            id="saved-payment-method"
            value={selectedPaymentMethodId}
            onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
            disabled={isLoading || isLoadingMethods || savedPaymentMethods.length === 0}
            className="form-control"
          >
            {savedPaymentMethods.length === 0 ? (
              <option value="">
                {isLoadingMethods
                  ? 'Loading payment methods...'
                  : 'No saved payment methods'}
              </option>
            ) : (
              savedPaymentMethods.map((paymentMethod) => (
                <option key={paymentMethod._id} value={paymentMethod._id}>
                  {formatPaymentMethod(paymentMethod)}
                </option>
              ))
            )}
          </select>
        </div>

        {savedPaymentMethods.length > 0 ? (
          <p className="form-hint">
            Select one of your saved cards, or add another method if you want to
            use a different one.
          </p>
        ) : (
          <div className="payment-method-warning">
            <p className="form-hint">
              Add a payment method first, then come back here to complete the
              payment.
            </p>
          </div>
        )}

        <Link
          className="secondary-link"
          to="/payment/add-method"
          state={{ appointmentId, amount, patientId }}
        >
          Add payment method
        </Link>

        <button
          type="submit"
          disabled={isLoading || isLoadingMethods || savedPaymentMethods.length === 0}
          className="btn btn-primary"
        >
          {isLoading ? 'Processing...' : `Pay $${amount || '0.00'}`}
        </button>
      </form>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

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

        .form-hint {
          margin: 0 0 15px;
          color: #6c757d;
          font-size: 13px;
        }

        .payment-method-warning {
          margin-bottom: 15px;
          padding: 12px;
          background-color: #fff3cd;
          border: 1px solid #ffe69c;
          border-radius: 6px;
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

        .secondary-link {
          display: inline-block;
          margin-bottom: 15px;
          color: #007bff;
          text-decoration: none;
          font-weight: 600;
        }

        .secondary-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;
