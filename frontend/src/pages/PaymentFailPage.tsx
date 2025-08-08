// src/pages/PaymentFailPage.jsx
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentFailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const transactionId = searchParams.get('transaction');
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');

  const getErrorMessage = () => {
    if (error) {
      return decodeURIComponent(error);
    }
    if (reason === 'validation_failed') {
      return 'Payment validation failed. Please try again.';
    }
    if (reason === 'server_error') {
      return 'Server error occurred during payment processing.';
    }
    return 'Payment could not be processed. Please try again.';
  };

  const handleRetry = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          {getErrorMessage()}
        </p>

        {transactionId && (
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <span className="font-medium">Transaction ID:</span>
              <br />
              <code className="text-xs bg-white px-2 py-1 rounded mt-1 inline-block">{transactionId}</code>
            </p>
          </div>
        )}

        {/* Troubleshooting Tips */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-yellow-800 mb-2">What you can do:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Check if your card has sufficient balance</li>
            <li>• Verify your card details are correct</li>
            <li>• Try using a different payment method</li>
            <li>• Contact your bank if the issue persists</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Back to Checkout
          </button>
          
          <button
            onClick={() => navigate('/cart')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            View Cart
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Need help?</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>📞 Call us: +880 1XXXXXXXXX</p>
            <p>📧 Email: support@yourstore.com</p>
            <p>💬 Live chat available 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailPage;