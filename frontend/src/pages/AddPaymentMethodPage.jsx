// AddPaymentMethodPage.jsx
// Page for adding new payment methods

import React from 'react';
import PaymentMethodForm from '../components/PaymentMethodForm';

const AddPaymentMethodPage = () => {
  return (
    <div className="add-payment-method-page">
      <div className="container">
        <header className="page-header">
          <h1>Add Payment Method</h1>
          <p>Securely add a new payment method to your account</p>
        </header>

        <main className="page-content">
          {/* Payment Method Form */}
          <PaymentMethodForm />

          {/* Security Information */}
          <div className="security-info">
            <h3>Security & Privacy</h3>
            <div className="security-features">
              <div className="security-item">
                <div className="security-icon">**</div>
                <div className="security-text">
                  <strong>256-bit SSL Encryption</strong>
                  <p>Your payment information is encrypted and protected</p>
                </div>
              </div>
              <div className="security-item">
                <div className="security-icon">**</div>
                <div className="security-text">
                  <strong>PCI DSS Compliant</strong>
                  <p>We meet the highest security standards for payment processing</p>
                </div>
              </div>
              <div className="security-item">
                <div className="security-icon">**</div>
                <div className="security-text">
                  <strong>No Data Storage</strong>
                  <p>We don't store your complete card details on our servers</p>
                </div>
              </div>
              <div className="security-item">
                <div className="security-icon">**</div>
                <div className="security-text">
                  <strong>Fraud Protection</strong>
                  <p>Advanced fraud detection systems protect your account</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="help-section">
            <h3>Need Help?</h3>
            <div className="help-content">
              <p>If you encounter any issues adding your payment method:</p>
              <ul>
                <li>Ensure all card details are entered correctly</li>
                <li>Check that your card hasn't expired</li>
                <li>Verify your billing address matches your card statement</li>
                <li>Contact your bank if the card is declined</li>
              </ul>
              <div className="contact-info">
                <p><strong>Customer Support:</strong></p>
                <p>Email: support@telemedicine.com</p>
                <p>Phone: 1-800-123-4567</p>
                <p>Available 24/7 for assistance</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .add-payment-method-page {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding: 20px 0;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5rem;
          font-weight: 600;
        }

        .page-header p {
          color: #666;
          font-size: 1.1rem;
          margin: 0;
        }

        .page-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .security-info {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .security-info h3 {
          color: #333;
          margin-bottom: 25px;
          font-size: 1.3rem;
          text-align: center;
        }

        .security-features {
          display: grid;
          gap: 20px;
        }

        .security-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #28a745;
        }

        .security-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #28a745, #20c997);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          flex-shrink: 0;
        }

        .security-text {
          flex: 1;
        }

        .security-text strong {
          display: block;
          color: #333;
          margin-bottom: 5px;
          font-size: 1rem;
        }

        .security-text p {
          color: #666;
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .help-section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .help-section h3 {
          color: #333;
          margin-bottom: 20px;
          font-size: 1.3rem;
        }

        .help-content p {
          color: #666;
          margin-bottom: 15px;
          line-height: 1.6;
        }

        .help-content ul {
          margin: 0 0 20px 0;
          padding-left: 20px;
        }

        .help-content li {
          color: #555;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .contact-info {
          background-color: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }

        .contact-info p {
          margin-bottom: 5px;
        }

        .contact-info p:first-child {
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .contact-info p:not(:first-child) {
          color: #1976d2;
          font-size: 0.9rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .security-info, .help-section {
            padding: 20px;
          }

          .security-item {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }

          .security-icon {
            margin: 0 auto;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 15px;
          }

          .page-header {
            margin-bottom: 30px;
          }

          .page-header h1 {
            font-size: 1.8rem;
          }

          .page-header p {
            font-size: 1rem;
          }

          .security-info, .help-section {
            padding: 15px;
          }

          .security-info h3, .help-section h3 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AddPaymentMethodPage;
