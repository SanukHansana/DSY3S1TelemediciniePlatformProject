// PaymentMethodForm.jsx
// Component for adding new payment methods

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentApi from '../services/paymentApi';

const PaymentMethodForm = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'credit_card',
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    isDefault: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested billing address fields
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Format card number input
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, ''); // Remove spaces
    let formattedValue = '';
    
    // Add spaces every 4 digits
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    
    // Limit to 16 digits
    if (value.length <= 16) {
      setFormData(prev => ({
        ...prev,
        cardNumber: formattedValue
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setMessageType('');

    // Basic validation
    if (!formData.cardNumber.replace(/\s/g, '')) {
      setMessage('Please enter a card number');
      setMessageType('error');
      return;
    }

    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      setMessage('Card number must be 16 digits');
      setMessageType('error');
      return;
    }

    if (!formData.cardholderName.trim()) {
      setMessage('Please enter the cardholder name');
      setMessageType('error');
      return;
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      setMessage('Please select expiry date');
      setMessageType('error');
      return;
    }

    if (!formData.cvv || formData.cvv.length !== 3) {
      setMessage('Please enter a valid 3-digit CVV');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payment method data
      const paymentMethodData = {
        type: formData.type,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName.trim(),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        cvv: formData.cvv,
        billingAddress: formData.billingAddress,
        isDefault: formData.isDefault
      };

      // Call API to add payment method
      const response = await paymentApi.addPaymentMethod(paymentMethodData);

      // Handle success
      setMessage('Payment method added successfully!');
      setMessageType('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          type: 'credit_card',
          cardNumber: '',
          cardholderName: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          billingAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          isDefault: false
        });
        setMessage(null);
        navigate('/payment');
      }, 3000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add payment method';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate year options (current year + 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);

  return (
    <div className="payment-method-form">
      <h3>Add Payment Method</h3>
      
      <form onSubmit={handleSubmit} className="form">
        {/* Payment Method Type */}
        <div className="form-group">
          <label htmlFor="type">Payment Method Type:</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            disabled={isLoading}
            className="form-control"
          >
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
          </select>
        </div>

        {/* Card Information */}
        <div className="card-section">
          <h4>Card Information</h4>
          
          <div className="form-group">
            <label htmlFor="cardNumber">Card Number:</label>
            <input
              id="cardNumber"
              name="cardNumber"
              type="text"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              disabled={isLoading}
              className="form-control"
              maxLength="19"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cardholderName">Cardholder Name:</label>
            <input
              id="cardholderName"
              name="cardholderName"
              type="text"
              value={formData.cardholderName}
              onChange={handleInputChange}
              placeholder="John Doe"
              disabled={isLoading}
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="expiryMonth">Expiry Month:</label>
              <select
                id="expiryMonth"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleInputChange}
                disabled={isLoading}
                className="form-control"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group half-width">
              <label htmlFor="expiryYear">Expiry Year:</label>
              <select
                id="expiryYear"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleInputChange}
                disabled={isLoading}
                className="form-control"
              >
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cvv">CVV:</label>
            <input
              id="cvv"
              name="cvv"
              type="text"
              value={formData.cvv}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 3) {
                  handleInputChange(e);
                }
              }}
              placeholder="123"
              disabled={isLoading}
              className="form-control"
              maxLength="3"
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className="billing-section">
          <h4>Billing Address</h4>
          
          <div className="form-group">
            <label htmlFor="street">Street Address:</label>
            <input
              id="street"
              name="billingAddress.street"
              type="text"
              value={formData.billingAddress.street}
              onChange={handleInputChange}
              placeholder="123 Main St"
              disabled={isLoading}
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="city">City:</label>
              <input
                id="city"
                name="billingAddress.city"
                type="text"
                value={formData.billingAddress.city}
                onChange={handleInputChange}
                placeholder="New York"
                disabled={isLoading}
                className="form-control"
              />
            </div>

            <div className="form-group half-width">
              <label htmlFor="state">State:</label>
              <input
                id="state"
                name="billingAddress.state"
                type="text"
                value={formData.billingAddress.state}
                onChange={handleInputChange}
                placeholder="NY"
                disabled={isLoading}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="zipCode">ZIP Code:</label>
              <input
                id="zipCode"
                name="billingAddress.zipCode"
                type="text"
                value={formData.billingAddress.zipCode}
                onChange={handleInputChange}
                placeholder="10001"
                disabled={isLoading}
                className="form-control"
              />
            </div>

            <div className="form-group half-width">
              <label htmlFor="country">Country:</label>
              <select
                id="country"
                name="billingAddress.country"
                value={formData.billingAddress.country}
                onChange={handleInputChange}
                disabled={isLoading}
                className="form-control"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Default Payment Method */}
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            Set as default payment method
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Adding Payment Method...' : 'Add Payment Method'}
        </button>
      </form>

      {/* Messages */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .payment-method-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .payment-method-form h3 {
          color: #333;
          margin-bottom: 30px;
          font-size: 1.5rem;
          font-weight: 600;
          text-align: center;
        }

        .card-section, .billing-section {
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .card-section h4, .billing-section h4 {
          color: #495057;
          margin-bottom: 20px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .half-width {
          flex: 1;
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
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .btn {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5a67d8;
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
          text-align: center;
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

        /* Responsive Design */
        @media (max-width: 768px) {
          .payment-method-form {
            margin: 20px 15px;
            padding: 20px;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }

          .card-section, .billing-section {
            padding: 15px;
          }
        }

        @media (max-width: 480px) {
          .payment-method-form {
            margin: 15px 10px;
            padding: 15px;
          }

          .payment-method-form h3 {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodForm;
