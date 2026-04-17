import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaymentStatusCard from '../components/PaymentStatusCard';
import RefundForm from '../components/RefundForm';
import paymentApi from '../services/paymentApi';

const PaymentStatusPage = () => {
  const { paymentId: urlPaymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentId, setPaymentId] = useState(urlPaymentId || '');
  const [inputPaymentId, setInputPaymentId] = useState(urlPaymentId || '');

  const fetchPayment = async (id) => {
    if (!id) {
      setError('Please enter a payment ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPayment(null);

    try {
      const response = await paymentApi.getPaymentById(id);
      setPayment(response);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch payment details';
      setError(errorMessage);
      console.error('Error fetching payment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchId = inputPaymentId.trim();

    if (searchId) {
      setPaymentId(searchId);
      navigate(`/payment/status/${searchId}`);
      fetchPayment(searchId);
    }
  };

  useEffect(() => {
    if (urlPaymentId) {
      setPaymentId(urlPaymentId);
      setInputPaymentId(urlPaymentId);
      fetchPayment(urlPaymentId);
    } else {
      setPaymentId('');
      setInputPaymentId('');
      setPayment(null);
      setError(null);
    }
  }, [urlPaymentId]);

  const handleRetry = () => {
    fetchPayment(payment?.paymentId || payment?.id || paymentId);
  };

  const handleClear = () => {
    setInputPaymentId('');
    setPaymentId('');
    setPayment(null);
    setError(null);
    navigate('/payment/status');
  };

  return (
    <div className="payment-status-page">
      <div className="container">
        <header className="page-header">
          <h1>Payment Status</h1>
          <p>Check the status and details of your payment</p>
        </header>

        <section className="search-section">
          <div className="search-card">
            <h3>Search Payment</h3>
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <label htmlFor="payment-id">Payment ID:</label>
                <input
                  id="payment-id"
                  type="text"
                  value={inputPaymentId}
                  onChange={(e) => setInputPaymentId(e.target.value)}
                  placeholder="Enter payment ID"
                  className="form-control"
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={!inputPaymentId.trim()}
                  className="btn btn-primary"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-secondary"
                >
                  Clear
                </button>
              </div>
            </form>

            <div className="test-hint">
              <small>Enter the payment ID returned after a successful payment.</small>
            </div>
          </div>
        </section>

        <section className="results-section">
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Fetching payment details...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="error-state">
              <div className="error-icon">!</div>
              <h3>Payment Not Found</h3>
              <p>{error}</p>
              <button onClick={handleRetry} className="btn btn-primary">
                Try Again
              </button>
            </div>
          )}

          {payment && !isLoading && !error && (
            <div className="payment-result">
              <PaymentStatusCard payment={payment} />

              <div className="action-buttons">
                <button
                  onClick={() =>
                    fetchPayment(payment.paymentId || payment.id || paymentId)
                  }
                  className="btn btn-outline"
                >
                  Refresh Status
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      payment.paymentId || payment.id || paymentId
                    );
                    alert('Payment ID copied to clipboard!');
                  }}
                  className="btn btn-outline"
                >
                  Copy Payment ID
                </button>
              </div>

              {(payment.status?.toLowerCase() === 'completed' ||
                payment.status?.toLowerCase() === 'success') && (
                <RefundForm
                  paymentId={payment.paymentId || payment.id}
                  maxAmount={payment.amount}
                />
              )}
            </div>
          )}

          {!payment && !isLoading && !error && !paymentId && (
            <div className="empty-state">
              <div className="empty-icon">?</div>
              <h3>No Payment Selected</h3>
              <p>Enter a payment ID above to check its status</p>
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .payment-status-page {
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

        .search-section {
          margin-bottom: 40px;
        }

        .search-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .search-card h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.3rem;
        }

        .search-form {
          margin-bottom: 15px;
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
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
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
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5a67d8;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #5a6268;
        }

        .btn-outline {
          background-color: transparent;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn-outline:hover {
          background-color: #667eea;
          color: white;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .test-hint {
          padding: 12px;
          background-color: #e3f2fd;
          border-radius: 6px;
          color: #1976d2;
          font-size: 0.9rem;
        }

        .results-section {
          margin-bottom: 40px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .error-state h3 {
          color: #dc3545;
          margin-bottom: 15px;
        }

        .error-state p {
          color: #666;
          margin-bottom: 25px;
        }

        .payment-result {
          margin-bottom: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          color: #666;
          margin-bottom: 15px;
        }

        .empty-state p {
          color: #999;
          margin: 0;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .search-card {
            padding: 20px;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-buttons .btn {
            width: 100%;
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

          .search-card {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentStatusPage;
