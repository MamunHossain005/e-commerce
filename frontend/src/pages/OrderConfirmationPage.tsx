import { useEffect } from "react";
import { FaCheckCircle, FaBox, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";


const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout } = useSelector((state) => state.checkout);

  //clear the cart when the order is cofirmed
  useEffect(() => {
    if(checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
    } else {
      navigate("/my-order");
    }
  }, [ checkout, dispatch, navigate]);

  const subtotal = checkout.checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  
  // Calculate estimated delivery date (10 days from order date)
  const estimatedDeliveryDate = new Date(checkout.createdAt);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 10);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thank you for your order!
          </h1>
          <p className="text-gray-600">
            Your order has been confirmed and will be shipped soon.
          </p>
        </div>

        {checkout && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Order Header */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <FaBox className="w-5 h-5 text-gray-500" />
                  <div>
                    <h2 className="font-semibold text-gray-900">Order #{checkout._id}</h2>
                    <p className="text-sm text-gray-500">Confirmation number</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {checkout.createdAt.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">Order date</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Order Items */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {checkout.checkoutItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>Color: <span className="capitalize">{item.color}</span></span>
                          <span>Size: {item.size}</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${item.price}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            ${item.price} × {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Shipping Address */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{checkout.shippingAddress.address}</p>
                    <p className="text-gray-900">
                      {checkout.shippingAddress.city}, {checkout.shippingAddress.country}
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Delivery Information</h4>
                <div className="mb-3">
                  <p className="text-blue-900 font-medium">
                    Estimated Delivery: {estimatedDeliveryDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <p className="text-blue-800 text-sm">
                  Your order will be processed within 1-2 business days and shipped via standard delivery. 
                  A tracking number will be sent to your email once your order ships.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Track Your Order
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderConfirmationPage