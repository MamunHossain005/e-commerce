import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchOrderDetails } from "../redux/slices/orderSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { RootState } from "../redux/store";
import type { AppDispatch } from "../redux/store";

const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get order ID from URL
  const dispatch = useDispatch<AppDispatch>();
  const { orderDetails, loading, error } = useSelector(
    (state: RootState) => state.orders
  );
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState(
    "Customer requested cancellation"
  );
  const [cancelError, setCancelError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetails(id));
    }
  }, [dispatch, id]);

  const handleDownloadInvoice = async () => {
    if (!orderDetails || !invoiceRef.current) return;
    setIsGeneratingInvoice(true);
    try {
      // Ensure the invoice is visible for capture (but off-screen)
      const input = invoiceRef.current;
      input.style.position = "absolute";
      input.style.left = "-9999px";
      input.style.display = "block";
      // Wait for any potential rendering
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Load all images
      const images = input.getElementsByTagName("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
        })
      );
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice_${orderDetails._id}.pdf`);
    } catch (error) {
      console.error("Error generating invoice:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate invoice. Please try again.";
      alert(errorMessage);
    } finally {
      const input = invoiceRef.current;
      if (input) {
        input.style.position = "";
        input.style.left = "";
        input.style.display = "none";
      }
      setIsGeneratingInvoice(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderDetails?.paymentDetails?.transactionId) {
      setCancelError("Cannot cancel order: Transaction ID not found");
      return;
    }
    setIsCancellingOrder(true);
    setCancelError(null);
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/sslcommerz/cancel/${
          orderDetails.paymentDetails.transactionId
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderDetails._id,
            reason: cancelReason || "Customer requested cancellation",
          }),
        }
      );
      // Check if the response is a redirect (3xx status codes)
      if (response.redirected) {
        // Follow the redirect
        window.location.href = response.url;
        return;
      }
      if (response.ok) {
        // Try to parse JSON response
        let result;
        try {
          result = await response.json();
        } catch (e) {
          // If JSON parsing fails, assume it's a redirect response
          result = { success: true };
        }
        if (result.success !== false) {
          // Show success message
          alert(
            "Order cancellation initiated successfully. You will be redirected to the cancellation page."
          );
          // Redirect to cancel page with transaction ID
          navigate(
            `/payment/cancel?transaction=${orderDetails.paymentDetails.transactionId}&order=${orderDetails._id}`
          );
        } else {
          throw new Error(result.message || "Failed to cancel order");
        }
      } else {
        // Handle HTTP error responses
        let errorMessage = "Failed to cancel order";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel order";
      setCancelError(`${errorMessage}. Please contact customer support.`);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const canCancelOrder = () => {
    if (!orderDetails) return false;
    // Order can be cancelled if:
    // 1. It's not delivered yet
    // 2. It was paid (has transaction ID)
    // 3. Payment status is not already "Cancelled" or "Failed"
    // 4. Order status is not already "Cancel"
    // 5. Order is not too old (optional - you might want to add time limits)
    const isNotDelivered = !orderDetails.isDelivered;
    const isPaidOrder =
      orderDetails.isPaid && orderDetails.paymentDetails?.transactionId;
    const isNotAlreadyCancelled =
      orderDetails.paymentStatus !== "Cancelled" &&
      orderDetails.paymentStatus !== "Failed" &&
      orderDetails.status !== "Cancel";
    // Optional: Check if order is within cancellation window (e.g., 24 hours)
    const orderDate = new Date(orderDetails.createdAt);
    const currentDate = new Date();
    const hoursDifference =
      (currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    const withinCancellationWindow = hoursDifference <= 24; // 24 hours window
    return (
      isNotDelivered &&
      isPaidOrder &&
      isNotAlreadyCancelled &&
      withinCancellationWindow
    );
  };

  const getCancellationTimeRemaining = () => {
    if (!orderDetails) return null;
    const orderDate = new Date(orderDetails.createdAt);
    const currentDate = new Date();
    const hoursDifference =
      (currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursDifference);
    if (hoursRemaining === 0) return null;
    if (hoursRemaining < 1) {
      return `${Math.floor(hoursRemaining * 60)} minutes`;
    }
    return `${Math.floor(hoursRemaining)} hours`;
  };

  const handleCloseModal = () => {
    setShowCancelConfirm(false);
    setCancelError(null);
    setCancelReason("Customer requested cancellation");
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Order Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading products: {error}</p>
        </div>
      </div>
    );
  }
  if (!orderDetails) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading products: {error}</p>
        </div>
      </div>
    );
  }

  const calculateSubtotal = () => {
    return (
      orderDetails.orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ) || 0
    );
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.1; // 10% tax
  };

  const calculateShipping = () => {
    return 15; // Fixed shipping cost
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const shipping = calculateShipping();
    return subtotal + tax + shipping;
  };

  const timeRemaining = getCancellationTimeRemaining();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Order Details</h2>
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back to My Orders</span>
        </button>
      </div>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Customer Info</h4>
          <p className="text-lg">Email: {orderDetails.customerInfo?.email}</p>
          <p className="text-lg">Phone: {orderDetails.customerInfo?.phone}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">
            Shipping Address
          </h4>
          <p className="text-lg">
            {orderDetails.shippingAddress.firstName}{" "}
            {orderDetails.shippingAddress.lastName}
            <br />
            {orderDetails.shippingAddress.address}
            <br />
            {orderDetails.shippingAddress.city},{" "}
            {orderDetails.shippingAddress.postalCode}
            <br />
            {orderDetails.shippingAddress.country}
          </p>
        </div>
        {orderDetails.orderNotes && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Order Notes</h4>
            <p className="text-lg">{orderDetails.orderNotes}</p>
          </div>
        )}
        {/* Order Header */}
        <div className="p-4 sm:p-6 rounded-lg border bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
              <p className="text-lg font-semibold">{orderDetails._id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
              <p className="text-lg">
                {new Date(orderDetails.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Payment Status
              </h3>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  orderDetails.isPaid
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {orderDetails.paymentStatus ||
                  (orderDetails.isPaid ? "Paid" : "Unpaid")}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Delivery Status
              </h3>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  orderDetails.isDelivered
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {orderDetails.isDelivered ? "Delivered" : "In Transit"}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="p-4 sm:p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {orderDetails.orderItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{item.name}</h4>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">
                        Price: ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Order Summary & Info */}
          <div className="space-y-6">
            {/* Payment & Shipping Info */}
            <div className="p-4 sm:p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">Payment & Shipping</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Payment Method
                  </h4>
                  <p className="text-lg">{orderDetails.paymentMethod}</p>
                </div>
                {orderDetails.paymentDetails?.transactionId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Transaction ID
                    </h4>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {orderDetails.paymentDetails.transactionId}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Customer Info
                  </h4>
                  <p className="text-lg">
                    Email: {orderDetails.customerInfo?.email}
                  </p>
                  <p className="text-lg">
                    Phone: {orderDetails.customerInfo?.phone}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Shipping Address
                  </h4>
                  <p className="text-lg">
                    {orderDetails.shippingAddress.firstName}{" "}
                    {orderDetails.shippingAddress.lastName}
                    <br />
                    {orderDetails.shippingAddress.address}
                    <br />
                    {orderDetails.shippingAddress.city},{" "}
                    {orderDetails.shippingAddress.postalCode}
                    <br />
                    {orderDetails.shippingAddress.country}
                  </p>
                </div>
                {orderDetails.orderNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Order Notes
                    </h4>
                    <p className="text-lg">{orderDetails.orderNotes}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Order Summary */}
            <div className="p-4 sm:p-6 rounded-lg border bg-gray-50">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${calculateTax(calculateSubtotal()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${calculateShipping().toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            {/* Hidden invoice */}
            <div ref={invoiceRef} className="hidden">
              <div className="p-8 bg-white" style={{ width: "210mm" }}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-2xl font-bold">INVOICE</h1>
                    <p className="text-gray-600">
                      Invoice #: {orderDetails?._id}
                    </p>
                    <p className="text-gray-600">
                      Date:{" "}
                      {orderDetails
                        ? new Date(orderDetails.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                    <p className="text-gray-600">
                      Transaction ID:{" "}
                      {orderDetails.paymentDetails?.transactionId || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold">E-commerce</h2>
                    <p className="text-gray-600">123 Business Street</p>
                    <p className="text-gray-600">Dhaka, Bangladesh</p>
                    <p className="text-gray-600">contact@ecommerce.com</p>
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
                  <p>{orderDetails?.customerInfo?.email}</p>
                  <p>{orderDetails?.customerInfo?.phone}</p>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">Ship To:</h3>
                  <p>
                    {orderDetails?.shippingAddress?.firstName}{" "}
                    {orderDetails?.shippingAddress?.lastName}
                  </p>
                  <p>{orderDetails?.shippingAddress?.address}</p>
                  <p>
                    {orderDetails?.shippingAddress?.city},{" "}
                    {orderDetails?.shippingAddress?.postalCode}
                  </p>
                  <p>{orderDetails?.shippingAddress?.country}</p>
                </div>
                {orderDetails.paymentDetails?.transactionId && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-2">
                      Payment Details:
                    </h3>
                    <p>
                      <span className="font-medium">Transaction Date:</span>{" "}
                      {new Date(
                        orderDetails.paidAt || Date.now()
                      ).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {orderDetails.paymentStatus || orderDetails.status}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{" "}
                      {orderDetails.totalPrice} {"BDT"}
                    </p>
                  </div>
                )}
                <table className="w-full mb-8 border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Item</th>
                      <th className="border p-2 text-left">Qty</th>
                      <th className="border p-2 text-left">Price</th>
                      <th className="border p-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails?.orderItems?.map((item) => (
                      <tr key={item.productId}>
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.quantity}</td>
                        <td className="border p-2">${item.price.toFixed(2)}</td>
                        <td className="border p-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mb-8">
                  <div className="w-1/3">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Tax (10%):</span>
                      <span>
                        ${calculateTax(calculateSubtotal()).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Shipping:</span>
                      <span>${calculateShipping().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-500 text-sm">
                  <p>Thank you for your business!</p>
                  <p>Payment Method: {orderDetails?.paymentMethod}</p>
                  {orderDetails?.isPaid && (
                    <p className="text-green-600">Payment Status: Paid</p>
                  )}
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Track Order
              </button>
              <button
                onClick={handleDownloadInvoice}
                disabled={isGeneratingInvoice}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                {isGeneratingInvoice ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Download Invoice"
                )}
              </button>
              {canCancelOrder() && (
                <div className="space-y-2">
                  {timeRemaining && (
                    <p className="text-sm text-orange-600 text-center">
                      Cancellation available for {timeRemaining}
                    </p>
                  )}
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
            {cancelError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {cancelError}
              </div>
            )}
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to cancel this order? This action cannot
                be undone.
                {orderDetails.isPaid &&
                  " Your payment will be refunded according to our refund policy."}
              </p>
              {timeRemaining && (
                <p className="text-sm text-orange-600">
                  You have {timeRemaining} remaining to cancel this order.
                </p>
              )}
              <div>
                <label
                  htmlFor="cancelReason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reason for cancellation (optional):
                </label>
                <select
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isCancellingOrder}
                >
                  <option value="Customer requested cancellation">
                    Customer requested cancellation
                  </option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price">
                    Found a better price
                  </option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="No longer needed">No longer needed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Important:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Refund processing may take 3-5 business days</li>
                  <li>
                    • You'll receive a confirmation email once cancellation is
                    complete
                  </li>
                  <li>• Orders already shipped cannot be cancelled</li>
                </ul>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isCancellingOrder}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancellingOrder}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {isCancellingOrder ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
