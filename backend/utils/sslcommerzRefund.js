// In a new file: utils/sslcommerzRefund.js
const SSLCommerzPayment = require('sslcommerz-lts');

const initiateSSLCommerzRefund = async (order, refundAmount, reason) => {
  const store_id = process.env.SSLCOMMERZ_STORE_ID;
  const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const is_live = process.env.NODE_ENV === "production";

  if (!order.paymentDetails?.bankTransactionId) {
    throw new Error("Bank transaction ID not found for this order");
  }

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  
  const refundData = {
    bank_tran_id: order.paymentDetails.bankTransactionId,
    refund_amount: refundAmount,
    refund_remarks: reason,
    ref_id: `REFUND_${order._id}_${Date.now()}`, // Unique reference
  };

  try {
    const response = await sslcz.initiateRefund(refundData);
    return response;
  } catch (error) {
    console.error("SSLCommerz refund error:", error);
    throw error;
  }
};

module.exports = initiateSSLCommerzRefund;