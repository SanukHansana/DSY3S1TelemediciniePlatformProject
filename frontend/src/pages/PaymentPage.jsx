import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';

const PaymentPage = () => {
  const location = useLocation();
  const stateData = location.state || {};

  const paymentData = {
    appointmentId: stateData.appointmentId || '',
    amount: stateData.amount || 0,
    patientId: stateData.patientId || '',
  };

  const hasRequiredPaymentData = Boolean(
    paymentData.appointmentId && paymentData.patientId && paymentData.amount
  );

  return (
    <div className="payment-page">
      <div className="container">
        <header className="page-header">
          <h1>Make Payment</h1>
          <p>Complete your payment for the appointment</p>
        </header>

        <main className="page-content">
          {hasRequiredPaymentData ? (
            <PaymentForm
              appointmentId={paymentData.appointmentId}
              amount={paymentData.amount}
              patientId={paymentData.patientId}
            />
          ) : (
            <div className="payment-warning">
              <h3>Payment details are missing</h3>
              <p>
                Create an appointment first so the payment page receives the
                appointment and patient information it needs.
              </p>
              <Link className="back-link" to="/">
                Back to appointments
              </Link>
            </div>
          )}

          <div className="payment-instructions">
            <h3>Payment Instructions</h3>
            <ul>
              <li>Select your preferred payment method from the dropdown</li>
              <li>Add a payment method first if you do not have a saved card yet</li>
              <li>Click "Pay" to initiate the payment process</li>
              <li>You will receive a confirmation once the payment is processed</li>
              <li>Keep the payment ID for your records</li>
            </ul>
          </div>
        </main>
      </div>

      <style jsx>{`
        .payment-page {
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

        .payment-warning {
          background-color: #fff3cd;
          border: 1px solid #ffe69c;
          border-radius: 8px;
          padding: 24px;
          color: #664d03;
        }

        .payment-warning h3 {
          margin: 0 0 12px;
        }

        .payment-warning p {
          margin: 0 0 16px;
        }

        .back-link {
          color: #7c5f00;
          font-weight: 600;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .payment-instructions {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .payment-instructions h3 {
          color: #333;
          margin-bottom: 20px;
          font-size: 1.3rem;
        }

        .payment-instructions ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .payment-instructions li {
          padding: 10px 0 10px 25px;
          border-bottom: 1px solid #eee;
          color: #555;
          position: relative;
        }

        .payment-instructions li:before {
          content: ">";
          position: absolute;
          left: 0;
          color: #28a745;
          font-weight: bold;
        }

        .payment-instructions li:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .payment-instructions {
            padding: 20px;
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
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
