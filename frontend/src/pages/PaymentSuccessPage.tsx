// src/pages/PaymentSuccessPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetails } from "../redux/slices/orderSlice";
import { clearCart } from "../redux/slices/cartSlice";
import type { RootState } from "../redux/store";
import type { AppDispatch } from "../redux/store";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const { user, guestId } = useSelector((state : RootState) => state.auth);
  const { orderDetails, loading, error } = useSelector((state : RootState) => state.orders);

  useEffect(() => {
    // Extract query parameters from the URL
    const queryParams = new URLSearchParams(location.search);
    const orderId = queryParams.get("order");
    const transactionId = queryParams.get("transaction");

    if (orderId) {
      setOrderId(orderId);
      // Only fetch order details if user is authenticated
      if (user) {
        dispatch(fetchOrderDetails(orderId));
      }
    }
    
    if (transactionId) {
      setTransactionId(transactionId);
      
      // Clear cart from localStorage (you already had this)
      localStorage.removeItem("cart");
      
      // Clear cart in Redux store and refetch from server
      dispatch(clearCart());
      
      // Refetch cart to get the updated state from server
      // const userId = user ? user._id : null;
      // dispatch(fetchCart({ userId, guestId }));
    }
  }, [location.search, dispatch, user, guestId]);

  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/order/${orderId}`);
    }
  };

  const handleContinueShopping = () => {
    navigate("/");
  };

  if(loading) <div>Loading...</div>
  if(error) <div>Error: {error}</div>

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="mt-2 text-gray-600">
            Thank you for your purchase. Your payment has been successfully processed.
          </p>
          {transactionId && (
            <p className="mt-2 text-gray-600">
              Transaction ID: <span className="font-medium">{transactionId}</span>
            </p>
          )}

          {/* If user is not authenticated, show a message to log in */}
          {!user && orderId && (
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your order has been placed successfully! Please log in to view your order details.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If there's an error fetching order details, show it */}
          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Error: {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If order details are loaded, show a summary */}
          {orderDetails && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-medium">{orderDetails._id}</span>
                </p>
                <p className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">${orderDetails.totalPrice.toFixed(2)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">{orderDetails.paymentMethod}</span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleViewOrder}
              disabled={!orderId || !user}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Order Details
            </button>
            <button
              onClick={handleContinueShopping}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;