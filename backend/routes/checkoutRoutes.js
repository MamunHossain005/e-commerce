const express = require("express");
const SSLCommerzPayment = require("sslcommerz-lts");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// SSLCommerz configuration
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.NODE_ENV === "production"; // true for live, false for sandbox

// @route POST /api/checkout
// @desc Create a new checkout Session
// @access Private
router.post("/", protect, async (req, res) => {
  const {
    checkoutItems,
    shippingAddress,
    paymentMethod,
    totalPrice,
    customerInfo,
    orderNotes,
  } = req.body;

  console.log(req.body);

  if (!checkoutItems || checkoutItems.length === 0) {
    return res.status(400).json({ message: "No items in checkout" });
  }

  // Validate required customer info for SSLCommerz
  if (!customerInfo || !customerInfo.phone) {
    return res
      .status(400)
      .json({ message: "Phone number is required for payment processing" });
  }

  try {
    // Create a new checkout session
    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems: checkoutItems,
      shippingAddress,
      paymentMethod: paymentMethod || "SSLCommerz",
      totalPrice,
      customerInfo,
      orderNotes,
      paymentStatus: "Pending",
      isPaid: false,
    });

    console.log(`Checkout created for user: ${req.user._id}`);
    res.status(201).json(newCheckout);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/checkout/sslcommerz/init
// @desc Initialize SSLCommerz payment
// @access Private
router.post("/sslcommerz/init", protect, async (req, res) => {
  try {
    console.log("SSLCommerz Init Request Body:", req.body);

    const {
      checkoutId,
      total_amount,
      currency = "BDT",
      tran_id,
      fail_url,
      cancel_url,
      cus_name,
      cus_email,
      cus_phone,
      cus_add1,
      cus_city,
      cus_postcode,
      cus_country,
      product_name,
      product_category = "General",
      product_profile = "general",
    } = req.body;

    // Validate required fields
    if (
      !checkoutId ||
      !total_amount ||
      !tran_id ||
      !cus_name ||
      !cus_email ||
      !cus_phone
    ) {
      return res.status(400).json({
        message: "Missing required payment fields",
        required: [
          "checkoutId",
          "total_amount",
          "tran_id",
          "cus_name",
          "cus_email",
          "cus_phone",
        ],
      });
    }

    // Validate checkout exists and belongs to user
    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to checkout" });
    }

    // Check if SSLCommerz credentials are configured
    if (!store_id || !store_passwd) {
      console.error("SSLCommerz credentials not configured");
      return res.status(500).json({
        message:
          "Payment gateway not properly configured. Please contact support.",
      });
    }

    // Ensure amount is a valid number and at least 1 BDT
    const amountInBDT = Math.max(1, Math.round(parseFloat(total_amount)));

    const data = {
      total_amount: amountInBDT,
      currency: "BDT",
      tran_id: tran_id,
      success_url: `${process.env.BACKEND_URL}/api/checkout/sslcommerz/success/${tran_id}`,
      fail_url: `${process.env.BACKEND_URL}/api/checkout/sslcommerz/fail/${tran_id}`,
      cancel_url: `${process.env.BACKEND_URL}/api/checkout/sslcommerz/cancel/${tran_id}`,
      ipn_url: `${process.env.BACKEND_URL}/api/checkout/sslcommerz/ipn`,
      shipping_method: "Courier",
      product_name: product_name || `Order-${checkoutId.slice(-8)}`,
      product_category: product_category,
      product_profile: product_profile,
      cus_name: cus_name.substring(0, 50), // SSLCommerz has character limits
      cus_email: cus_email,
      cus_add1: cus_add1 || "N/A",
      cus_add2: "N/A",
      cus_city: cus_city || "Dhaka",
      cus_state: cus_city || "Dhaka",
      cus_postcode: cus_postcode || "1000",
      cus_country: cus_country || "Bangladesh",
      cus_phone: cus_phone,
      cus_fax: cus_phone,
      ship_name: cus_name.substring(0, 50),
      ship_add1: cus_add1 || "N/A",
      ship_add2: "N/A",
      ship_city: cus_city || "Dhaka",
      ship_state: cus_city || "Dhaka",
      ship_postcode: cus_postcode || "1000",
      ship_country: cus_country || "Bangladesh",
      // Additional parameters for better integration
      emi_option: 0,
      multi_card_name: "mastercard,visacard,amexcard",
      value_a: checkoutId, // Store checkout ID for reference
      value_b: req.user._id.toString(), // Store user ID for reference
      value_c: "web_checkout", // Source identifier
      value_d: new Date().toISOString(), // Timestamp
    };

    console.log("SSLCommerz Payment Data:", {
      ...data,
      // Don't log sensitive data in production
      cus_phone: data.cus_phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
      cus_email: data.cus_email.replace(/(.{2}).*(@.*)/, "$1***$2"),
    });

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    const apiResponse = await sslcz.init(data);

    console.log("SSLCommerz API Response Status:", apiResponse.status);

    if (apiResponse.status === "SUCCESS") {
      // Update checkout with SSLCommerz transaction details
      checkout.sslTransactionId = tran_id;
      checkout.paymentStatus = "Initiated";
      checkout.paymentDetails = {
        ...checkout.paymentDetails,
        currency: "BDT",
        initiatedAt: new Date(),
        gatewayResponse: {
          sessionkey: apiResponse.sessionkey,
          GatewayPageURL: apiResponse.GatewayPageURL,
          status: apiResponse.status,
        },
      };
      await checkout.save();

      console.log(
        "SSLCommerz Payment Initiated Successfully for checkout:",
        checkoutId
      );

      res.json({
        status: apiResponse.status,
        GatewayPageURL: apiResponse.GatewayPageURL,
        sessionkey: apiResponse.sessionkey,
        message: "Payment gateway initialized successfully",
      });
    } else {
      res.redirect(
        `${
          process.env.FRONTEND_URL
        }/payment/fail?transaction=${tran_id}&error=${encodeURIComponent(
          error
        )}`
      );
      console.error("SSLCommerz Init Failed:", apiResponse);

      // Update checkout with failure info
      checkout.paymentStatus = "Failed";
      checkout.paymentDetails = {
        ...checkout.paymentDetails,
        error: apiResponse.failedreason || "Gateway initialization failed",
        failedAt: new Date(),
        gatewayResponse: apiResponse,
      };
      await checkout.save();

      res.status(400).json({
        message:
          apiResponse.failedreason || "Failed to initialize payment gateway",
        status: apiResponse.status || "FAILED",
        details: is_live ? "Please try again or contact support" : apiResponse,
      });
    }
  } catch (error) {
    console.error("SSLCommerz initialization error:", error);

    // Try to update checkout with error info if we have checkoutId
    if (req.body.checkoutId) {
      try {
        const checkout = await Checkout.findById(req.body.checkoutId);
        if (checkout) {
          checkout.paymentStatus = "Failed";
          checkout.paymentDetails = {
            ...checkout.paymentDetails,
            error: error.message,
            failedAt: new Date(),
          };
          await checkout.save();
        }
      } catch (updateError) {
        console.error("Failed to update checkout with error:", updateError);
      }
    }

    res.status(500).json({
      message: "Payment gateway error. Please try again later.",
      error: is_live ? "Internal server error" : error.message,
    });
  }
});

// @route POST /api/checkout/sslcommerz/success/:id
// @desc Handle successful SSLCommerz payment and create order
// @access Public (called by SSLCommerz)
router.post("/sslcommerz/success/:id", async (req, res) => {
  try {
    const tran_id = req.params?.id;

    // Find checkout by transaction ID
    const checkout = await Checkout.findOne({ sslTransactionId: tran_id });

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    // Update checkout status
    checkout.isPaid = true;
    checkout.paymentStatus = "Completed";
    checkout.paidAt = new Date();
    checkout.paymentDetails = {
      transactionId: tran_id,
    };
    await checkout.save();

    // Create the order
    const orderData = {
      user: checkout.user,
      orderItems: checkout.checkoutItems,
      shippingAddress: checkout.shippingAddress,
      customerInfo: checkout.customerInfo,
      paymentMethod: checkout.paymentMethod,
      totalPrice: checkout.totalPrice,
      orderNotes: checkout.orderNotes,
      isPaid: true,
      paidAt: checkout.paidAt,
      paymentStatus: "Completed",
      paymentDetails: checkout.paymentDetails,
    };

    // Create order using the Order model
    const newOrder = await Order.create(orderData);

    // Mark checkout as finalized
    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    checkout.orderId = newOrder._id; // Store reference to the order
    await checkout.save();

    // Clear user's cart
    await Cart.findOneAndDelete({ user: checkout.user });

    // Redirect to success page with order ID
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?order=${newOrder._id}&transaction=${tran_id}`
    );
  } catch (error) {
    console.error("SSLCommerz success handler error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/fail?reason=server_error`
    );
  }
});

// @route POST /api/checkout/sslcommerz/fail
// @desc Handle failed SSLCommerz payment
// @access Public (called by SSLCommerz)
router.post("/sslcommerz/fail/:id", async (req, res) => {
  try {
    const tran_id = req.params.id;
    // Update checkout status
    const checkout = await Checkout.findOne({ sslTransactionId: tran_id });
    if (checkout) {
      checkout.paymentStatus = "Failed";
      checkout.paymentDetails = { error: "Payment failed", failedAt: new Date() };
      await checkout.save();
    }

    res.redirect(
      `${
        process.env.FRONTEND_URL
      }/payment/fail?transaction=${tran_id}&error=${encodeURIComponent("Payment failed")}`
    );
  } catch (error) {
    console.error("SSLCommerz fail handler error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/fail?reason=server_error`
    );
  }
});

// @route POST /api/checkout/sslcommerz/cancel/:id
// @desc Handle cancelled SSLCommerz payment or user-initiated cancellation
// @access Public (called by SSLCommerz) and Private (for user cancellation)
router.post("/sslcommerz/cancel/:id", async (req, res) => {
  try {
    const tran_id = req.params.id;
    const { orderId, reason } = req.body;

    console.log("Cancellation request received:", { tran_id, orderId, reason });

    // Find the transaction/order to cancel
    let order = null;
    let checkout = null;

    // If orderId is provided, this is a user-initiated cancellation
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Validate order can be cancelled
      const canCancel = validateOrderCancellation(order);
      if (!canCancel.valid) {
        return res.status(400).json({ 
          success: false, 
          message: canCancel.reason 
        });
      }

      // Update order status
      order.status = "Cancel";
      order.paymentStatus = "Cancelled";
      order.cancelledAt = new Date();
      order.cancellationReason = reason || "Customer requested cancellation";
      await order.save();

      console.log(`Order ${orderId} cancelled successfully`);

      // If this is an API request (has Authorization header), return JSON
      const authHeader = req.headers.authorization;
      if (authHeader) {
        return res.json({
          success: true,
          message: "Order cancelled successfully",
          order: order
        });
      }

      // Otherwise redirect to frontend cancel page
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/cancel?transaction=${tran_id}&order=${orderId}&success=true`
      );
    }

    // This is a gateway-initiated cancellation (user cancelled on payment page)
    checkout = await Checkout.findOne({ sslTransactionId: tran_id });
    if (checkout) {
      checkout.paymentStatus = "Cancelled";
      checkout.paymentDetails = { 
        ...checkout.paymentDetails,
        cancelledAt: new Date(),
        cancellationReason: "Payment cancelled at gateway"
      };
      await checkout.save();

      console.log(`Checkout ${checkout._id} cancelled at gateway`);
    }

    // Redirect to frontend cancel page
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/cancel?transaction=${tran_id}&gateway_cancel=true`
    );

  } catch (error) {
    console.error("SSLCommerz cancel handler error:", error);
    
    // Check if this is an API request
    const authHeader = req.headers.authorization;
    if (authHeader) {
      return res.status(500).json({
        success: false,
        message: "Server error during cancellation. Please contact support.",
        error: is_live ? undefined : error.message
      });
    }

    // Redirect for gateway cancellation
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/cancel?reason=server_error`
    );
  }
});

// Helper function to validate if order can be cancelled
function validateOrderCancellation(order) {
  // Check if order is already delivered
  if (order.isDelivered) {
    return {
      valid: false,
      reason: "Cannot cancel delivered orders"
    };
  }

  // Check if order is already cancelled
  if (order.status === "Cancel" || order.paymentStatus === "Cancelled") {
    return {
      valid: false,
      reason: "Order is already cancelled"
    };
  }

  // Check if order has payment transaction ID (required for refund)
  if (!order.paymentDetails?.transactionId && order.isPaid) {
    return {
      valid: false,
      reason: "Cannot process cancellation - transaction details not found"
    };
  }

  // Check time window (24 hours)
  const orderDate = new Date(order.createdAt);
  const currentDate = new Date();
  const hoursDifference = (currentDate - orderDate) / (1000 * 60 * 60);
  
  if (hoursDifference > 24) {
    return {
      valid: false,
      reason: "Order cancellation window has expired (24 hours)"
    };
  }

  return { valid: true };
}

// @route GET /api/checkout/sslcommerz/refund-status/:transactionId
// @desc Check refund status for a cancelled order
// @access Private
router.get("/sslcommerz/refund-status/:transactionId", protect, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Initialize SSLCommerz
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    
    // Query refund status (this is a hypothetical method - check SSLCommerz docs)
    const refundStatus = await sslcz.refundQuery({ tran_id: transactionId });
    
    res.json({
      success: true,
      transactionId,
      refundStatus
    });
  } catch (error) {
    console.error("Refund status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check refund status",
      error: is_live ? undefined : error.message
    });
  }
});

// @route POST /api/checkout/sslcommerz/ipn
// @desc Handle SSLCommerz IPN (Instant Payment Notification)
// @access Public (called by SSLCommerz)
router.post("/sslcommerz/ipn", async (req, res) => {
  try {
    console.log("SSLCommerz IPN Callback:", req.body);

    const { tran_id, val_id, status } = req.body;

    // Validate the IPN
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id: val_id });

    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      const checkout = await Checkout.findOne({ sslTransactionId: tran_id });

      if (checkout && !checkout.isPaid) {
        checkout.isPaid = true;
        checkout.paymentStatus = "Completed";
        checkout.paidAt = new Date();
        checkout.paymentDetails = {
          ...checkout.paymentDetails,
          ipnValidation: validation,
          ipnReceivedAt: new Date(),
        };
        await checkout.save();

        console.log("Payment confirmed via IPN for transaction:", tran_id);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("SSLCommerz IPN handler error:", error);
    res.status(500).send("Error");
  }
});

// @route GET /api/checkout/:id
// @desc Get checkout by ID
// @access Private
router.get("/:id", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    // Ensure user can only access their own checkouts
    if (checkout.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to checkout" });
    }

    res.json(checkout);
  } catch (error) {
    console.error("Get checkout error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PATCH /api/checkout/:id/payment
// @desc Update checkout payment status
// @access Private
router.patch("/:id/payment", protect, async (req, res) => {
  const { paymentStatus, paymentDetails, transactionId, isPaid } = req.body;

  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    // Ensure user can only update their own checkouts
    if (checkout.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to checkout" });
    }

    // Update payment information
    checkout.isPaid = isPaid !== undefined ? isPaid : checkout.isPaid;
    checkout.paymentStatus = paymentStatus || checkout.paymentStatus;
    checkout.paymentDetails = paymentDetails || checkout.paymentDetails;
    checkout.sslTransactionId = transactionId || checkout.sslTransactionId;

    if (isPaid && !checkout.paidAt) {
      checkout.paidAt = new Date();
    }

    await checkout.save();
    res.json(checkout);
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PATCH /api/checkout/:id/finalize
// @desc Finalize checkout and convert to an order after payment confirmation
// @access Private
router.patch("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    // Ensure user can only finalize their own checkouts
    if (checkout.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to checkout" });
    }

    if (checkout.isPaid && !checkout.isFinalized) {
      // Create final order based on the checkout details
      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItems,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: checkout.paymentMethod,
        totalPrice: checkout.totalPrice,
        customerInfo: checkout.customerInfo,
        orderNotes: checkout.orderNotes,
        isPaid: true,
        paidAt: checkout.paidAt,
        isDelivered: false,
        paymentStatus: checkout.paymentStatus,
        paymentDetails: checkout.paymentDetails,
      });

      // Mark the checkout as finalized
      checkout.isFinalized = true;
      checkout.finalizedAt = new Date();
      await checkout.save();

      // Delete the cart associated with the user
      await Cart.findOneAndDelete({ user: checkout.user });

      res.status(201).json(finalOrder);
    } else if (checkout.isFinalized) {
      res.status(400).json({ message: "Checkout already finalized" });
    } else {
      res.status(400).json({ message: "Checkout is not paid" });
    }
  } catch (error) {
    console.error("Finalize checkout error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;