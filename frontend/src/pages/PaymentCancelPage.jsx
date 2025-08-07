// src/pages/PaymentCancelPage.jsx
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const transactionId = searchParams.get('transaction');
  const reason = searchParams.get('reason');

  const getMessage = () => {
    if (reason === 'server_error') {
      return 'Payment was cancelled due to a server error. Your order is still in your cart.';
    }
    return 'You have cancelled the payment process. Your order is still in your cart and ready for checkout.';
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
          <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Cancel Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          {getMessage()}
        </p>

        {transactionId && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Transaction ID:</span>
              <br />
              <code className="text-xs bg-white px-2 py-1 rounded mt-1 inline-block">{transactionId}</code>
            </p>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
          <div className="text-sm text-blue-700 text-left space-y-1">
            <p>• Your cart items are still saved</p>
            <p>• No charges have been made</p>
            <p>• You can continue shopping or try payment again</p>
            <p>• Items will be held for 24 hours</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-md hover:bg-yellow-700 transition-colors font-medium"
          >
            Complete Payment
          </button>
          
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            View Cart
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Continue Shopping
          </button>
        </div>

        {/* Additional Options */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Having trouble with payment?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="text-xs bg-gray-100 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors"
            >
              Update Payment Info
            </button>
            <button
              onClick={() => window.open('mailto:support@yourstore.com')}
              className="text-xs bg-gray-100 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;