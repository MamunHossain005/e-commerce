import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createCheckout,
  clearCheckout,
  clearCheckoutError,
} from "../../redux/slices/checkoutSlice";

type InputOrSelectChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement
>;

interface RootState {
  cart: {
    cart: {
      products: any[];
      totalPrice: number;
    };
    loading: boolean;
    error: string | null;
  };
  auth: {
    user: {
      _id: string;
      email?: string;
    } | null;
  };
  checkout: {
    checkout: any;
    loading: boolean;
    error: string | null;
  };
}

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    cart,
    loading: cartLoading,
    error: cartError,
  } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    checkout,
    loading: checkoutLoading,
    error: checkoutError,
  } = useSelector((state: RootState) => state.checkout);

  const [contactInfo, setContactInfo] = useState({
    email: user?.email || "",
    phone: "",
  });
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "BD", // Default to Bangladesh
  });
  const [paymentInfo, setPaymentInfo] = useState({
    paymentMethod: "sslcommerz", // Default to SSLCommerz
  });
  const [orderNotes, setOrderNotes] = useState("");
  const [sslcommerzLoading, setSslcommerzLoading] = useState(false);

  const handleContactChange = (e: InputOrSelectChangeEvent) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handleShippingChange = (e: InputOrSelectChangeEvent) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e: InputOrSelectChangeEvent) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
  };

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "An unknown error occurred";
  }

  const shippingCost = 15;
  const tax = Math.round(cart.totalPrice * 0.08);
  const finalTotal = cart.totalPrice + shippingCost + tax;

  // Clear any previous checkout errors on component mount
  useEffect(() => {
    dispatch(clearCheckoutError());
    return () => {
      // Clear checkout state when leaving the component
      dispatch(clearCheckout());
    };
  }, [dispatch]);

  // Ensure cart is loaded and user is authenticated before proceeding
  useEffect(() => {
    if (!cart || !cart.products || cart.products.length === 0) {
      navigate("/cart");
    }
    if (!user) {
      navigate("/login");
    }
  }, [cart, user, navigate]);

  // Transform cart products to match checkout schema
  const transformCartItems = () => {
    return cart.products.map((product: any) => ({
      productId: product.productId,
      name: product.name,
      image: product.image,
      price: parseFloat(product.price.toString()),
      quantity: product.quantity,
      size: product.size,
      color: product.color,
    }));
  };

  // Handle SSLCommerz payment initiation
  const initiateSSLCommerzPayment = async () => {
    if (!checkout?._id) {
      alert("Please create checkout session first");
      return;
    }

    // Validate required fields before payment
    if (!contactInfo.email || !contactInfo.phone) {
      alert("Email and phone number are required for payment");
      return;
    }

    if (!shippingAddress.firstName || !shippingAddress.lastName) {
      alert("First name and last name are required for payment");
      return;
    }

    setSslcommerzLoading(true);

    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        throw new Error("Please login to continue");
      }

      // Convert amount to BDT (assuming 1 USD = 85 BDT)
      const amountInBDT = Math.round(finalTotal * 85);

      const paymentData = {
        checkoutId: checkout._id,
        total_amount: amountInBDT,
        currency: "BDT",
        tran_id: `TXN_${checkout._id}_${Date.now()}`,
        emi_option: 0,
        cus_name:
          `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
        cus_email: contactInfo.email,
        cus_phone: contactInfo.phone,
        cus_add1: shippingAddress.address,
        cus_city: shippingAddress.city,
        cus_postcode: shippingAddress.postalCode,
        cus_country: shippingAddress.country,
        shipping_method: "Courier",
        product_name: `Order-${checkout._id.slice(-8)}`,
        product_category: "General",
        product_profile: "general",
      };

      console.log("Initiating SSLCommerz payment with data:", paymentData);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/sslcommerz/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      console.log(response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SSLCommerz API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("SSLCommerz API Response:", result);

      if (result.status === "SUCCESS" && result.GatewayPageURL) {
        console.log("Redirecting to payment gateway:", result.GatewayPageURL);
        // Redirect to SSLCommerz payment page
        window.location.replace(result.GatewayPageURL);
      } else {
        throw new Error(
          result.message ||
            result.failedreason ||
            "Failed to initialize payment gateway"
        );
      }
    } catch (error) {
      console.error("SSLCommerz payment error:", error);
      const message = getErrorMessage(error);

      let errorMessage = "Failed to initialize payment. ";
      if (message.includes("fetch")) {
        errorMessage += "Please check your internet connection and try again.";
      } else if (message.includes("HTTP 500")) {
        errorMessage += "Server error. Please try again later.";
      } else if (message.includes("HTTP 400")) {
        errorMessage += "Invalid payment data. Please check your information.";
      } else {
        errorMessage += message || "Please try again.";
      }

      alert(errorMessage);
    } finally {
      setSslcommerzLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to continue with checkout");
      navigate("/login");
      return;
    }

    if (cart && cart.products.length > 0) {
      // Validate required fields
      const requiredShippingFields = [
        "firstName",
        "lastName",
        "address",
        "city",
        "postalCode",
        "country",
      ];
      const missingFields = requiredShippingFields.filter(
        (field) => !shippingAddress[field as keyof typeof shippingAddress]
      );

      if (missingFields.length > 0) {
        alert(
          `Please fill in all required shipping fields: ${missingFields.join(
            ", "
          )}`
        );
        return;
      }

      if (!contactInfo.phone) {
        alert("Phone number is required for payment processing");
        return;
      }

      const checkoutData = {
        user: user._id,
        checkoutItems: transformCartItems(),
        shippingAddress: {
          ...shippingAddress,
        },
        paymentMethod: "SSLCommerz",
        totalPrice: finalTotal,
        customerInfo: {
          email: contactInfo.email,
          phone: contactInfo.phone,
        },
        orderNotes: orderNotes,
      };

      try {
        const result = await dispatch(createCheckout(checkoutData) as any);

        if (result.type === "checkout/createCheckout/fulfilled") {
          console.log("Checkout created successfully:", result.payload);
          // Don't automatically initiate payment - wait for user to click pay button
        } else if (result.type === "checkout/createCheckout/rejected") {
          console.error("Checkout creation failed:", result.payload);
          alert("Failed to create checkout. Please try again.");
        }
      } catch (error) {
        console.error("Checkout error:", error);
        alert("An error occurred during checkout. Please try again.");
      }
    }
  };

  // Show loading state
  if (cartLoading || checkoutLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg">
            {cartLoading ? "Loading cart..." : "Processing checkout..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (cartError || checkoutError) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
        <p className="text-red-600 mb-4">{cartError || checkoutError}</p>
        <button
          onClick={() => {
            dispatch(clearCheckoutError());
            navigate("/cart");
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Back to Cart
        </button>
      </div>
    );
  }

  // Show empty cart state
  if (!cart || !cart.products || cart.products.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Left section - Checkout Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-2xl font-bold uppercase mb-6">Checkout</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactInfo.email}
                  onChange={handleContactChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={contactInfo.phone}
                  onChange={handleContactChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+880 1XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-gray-700 mb-2"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={shippingAddress.firstName}
                    onChange={handleShippingChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-gray-700 mb-2"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={shippingAddress.lastName}
                    onChange={handleShippingChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={shippingAddress.address}
                  onChange={handleShippingChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="House/Flat, Road, Area"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleShippingChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select City</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                    <option value="Comilla">Comilla</option>
                    <option value="Gazipur">Gazipur</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-gray-700 mb-2"
                  >
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={handleShippingChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleShippingChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="BD">Bangladesh</option>
                    <option value="IN">India</option>
                    <option value="PK">Pakistan</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="sslcommerz"
                  checked={paymentInfo.paymentMethod === "sslcommerz"}
                  onChange={handlePaymentChange}
                  className="text-blue-600"
                />
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    SSL
                  </div>
                  <div>
                    <div className="font-semibold">SSLCommerz</div>
                    <div className="text-sm text-gray-600">
                      Pay with bKash, Nagad, Rocket, Credit/Debit Cards
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Order Notes */}
          <div>
            <label htmlFor="orderNotes" className="block text-gray-700 mb-2">
              Order Notes (Optional)
            </label>
            <textarea
              id="orderNotes"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any special instructions for your order..."
            />
          </div>

          {/* Submit Button or Payment Button */}
          <div className="mt-6">
            {!checkout ? (
              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full bg-black text-white py-4 px-6 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-semibold uppercase tracking-wider"
              >
                {checkoutLoading ? "Processing..." : "Create Order"}
              </button>
            ) : (
              <div>
                <h3 className="text-lg mb-4 font-semibold">Complete Payment</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Order ID: <span className="font-mono">{checkout._id}</span>
                  </p>
                  <p className="text-lg font-semibold">
                    Total: ৳{(finalTotal * 85).toFixed(2)} BDT
                  </p>
                  <p className="text-sm text-gray-600">
                    (≈ ${finalTotal.toFixed(2)} USD)
                  </p>
                </div>
                <button
                  onClick={initiateSSLCommerzPayment}
                  disabled={sslcommerzLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-md hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  {sslcommerzLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Pay with SSLCommerz</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </>
                  )}
                </button>
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-600">
                    Secure payment powered by SSLCommerz
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Right section - Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6 shadow-sm border h-fit">
        <h3 className="text-xl font-bold mb-6">Order Summary</h3>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cart.products.map((product: any, index: number) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 bg-white rounded-lg"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1">
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-gray-600">
                  {product.size && `Size: ${product.size}`}
                  {product.size && product.color && " | "}
                  {product.color && `Color: ${product.color}`}
                </p>
                <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ${(parseFloat(product.price) * product.quantity).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  ৳
                  {(parseFloat(product.price) * product.quantity * 85).toFixed(
                    0
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <div className="text-right">
              <span>${cart.totalPrice.toFixed(2)}</span>
              <p className="text-sm text-gray-600">
                ৳{(cart.totalPrice * 85).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <div className="text-right">
              <span>${shippingCost.toFixed(2)}</span>
              <p className="text-sm text-gray-600">
                ৳{(shippingCost * 85).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <div className="text-right">
              <span>${tax.toFixed(2)}</span>
              <p className="text-sm text-gray-600">৳{(tax * 85).toFixed(0)}</p>
            </div>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <div className="text-right">
              <span>${finalTotal.toFixed(2)}</span>
              <p className="text-sm font-normal text-gray-600">
                ৳{(finalTotal * 85).toFixed(0)} BDT
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods Available */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-800">
            Available Payment Methods
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded text-xs font-semibold text-pink-600">
              bKash
            </div>
            <div className="bg-white p-2 rounded text-xs font-semibold text-orange-600">
              Nagad
            </div>
            <div className="bg-white p-2 rounded text-xs font-semibold text-purple-600">
              Rocket
            </div>
            <div className="bg-white p-2 rounded text-xs font-semibold text-blue-600">
              Visa
            </div>
            <div className="bg-white p-2 rounded text-xs font-semibold text-red-600">
              MasterCard
            </div>
            <div className="bg-white p-2 rounded text-xs font-semibold text-green-600">
              AMEX
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-green-800">
              Secured by SSLCommerz - Bangladesh's #1 Payment Gateway
            </span>
          </div>
        </div>

        {/* Return Policy */}
        <div className="mt-4 text-xs text-gray-600">
          <p>🚚 Free delivery within Dhaka (Orders above ৳1000)</p>
          <p>↩️ 7 days return policy</p>
          <p>📞 24/7 customer support</p>
          <p>✅ 100% secure payment</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
