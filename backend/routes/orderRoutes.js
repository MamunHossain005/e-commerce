const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// @route GET /api/orders/my-orders
// @desc Get logged-in user's orders
// @access Private
router.get("/my-orders", protect, async (req, res) => {
  try {
    // Find orders for the authenticated user
    const orders = await Order.find({ user: req.user?._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route Get /api/orders/:id
// @desc Get order details by ID
// @access Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure user can only access their own orders
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }
    
    // Return the full order details
    res.json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/orders
// @desc Create a new order from checkout
// @access Private
router.post("/", protect, async (req, res) => {
  try {
    const {
      checkoutItems,
      shippingAddress,
      customerInfo,
      paymentMethod,
      totalPrice,
      orderNotes,
      paymentDetails,
    } = req.body;

    // Create a new order
    const newOrder = new Order({
      user: req.user._id,
      orderItems: checkoutItems,
      shippingAddress,
      customerInfo,
      paymentMethod,
      totalPrice,
      orderNotes,
      paymentDetails,
      isPaid: paymentDetails ? true : false,
      paidAt: paymentDetails ? new Date() : null,
      paymentStatus: paymentDetails ? "Completed" : "Pending",
    });

    const createdOrder = await newOrder.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/orders/:id/cancel
// @desc Cancel an order
// @access Private
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const { reason = "Customer requested cancellation" } = req.body;
    const orderId = req.params.id;

    console.log(`Cancellation request for order ${orderId} by user ${req.user._id}`);

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Ensure user can only cancel their own orders
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Validate if order can be cancelled using the virtual method
    if (!order.canBeCancelled) {
      let reason = "Order cannot be cancelled";
      
      if (order.isDelivered) {
        reason = "Cannot cancel delivered orders";
      } else if (order.status === 'Cancel' || order.paymentStatus === 'Cancelled') {
        reason = "Order is already cancelled";
      } else if (!order.paymentDetails?.transactionId && order.isPaid) {
        reason = "Cannot process cancellation - transaction details not found";
      } else {
        const hoursDiff = (new Date() - order.createdAt) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
          reason = "Order cancellation window has expired (24 hours)";
        }
      }

      return res.status(400).json({
        success: false,
        message: reason
      });
    }

    // Cancel the order using the model method
    await order.cancelOrder(reason, 'customer');

    console.log(`Order ${orderId} cancelled successfully`);

    // If payment was made, initiate refund process
    if (order.isPaid && order.paymentDetails?.transactionId) {
      // Here you would typically call your payment gateway's refund API
      // For now, we'll just log it and set refund status to pending
      console.log(`Initiating refund for transaction ${order.paymentDetails.transactionId}`);
      
      // You could call SSLCommerz refund API here
      // const refundResult = await initiateRefund(order.paymentDetails.transactionId, order.totalPrice);
      
      order.refundStatus = 'initiated';
      await order.save();
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason,
        refundStatus: order.refundStatus
      }
    });

  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Server error during order cancellation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route GET /api/orders/:id/cancellation-status
// @desc Check if an order can be cancelled and get time remaining
// @access Private
router.get("/:id/cancellation-status", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure user can only check their own orders
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }

    const canCancel = order.canBeCancelled;
    let timeRemaining = null;
    let reason = null;

    if (!canCancel) {
      if (order.isDelivered) {
        reason = "Order has been delivered";
      } else if (order.status === 'Cancel' || order.paymentStatus === 'Cancelled') {
        reason = "Order is already cancelled";
      } else if (!order.paymentDetails?.transactionId && order.isPaid) {
        reason = "Transaction details not found";
      } else {
        reason = "Cancellation window has expired";
      }
    } else {
      // Calculate time remaining for cancellation (24 hours from order creation)
      const orderDate = new Date(order.createdAt);
      const currentDate = new Date();
      const hoursDifference = (currentDate - orderDate) / (1000 * 60 * 60);
      const hoursRemaining = Math.max(0, 24 - hoursDifference);
      
      if (hoursRemaining > 0) {
        if (hoursRemaining < 1) {
          timeRemaining = `${Math.floor(hoursRemaining * 60)} minutes`;
        } else {
          timeRemaining = `${Math.floor(hoursRemaining)} hours`;
        }
      }
    }

    res.json({
      canCancel,
      timeRemaining,
      reason,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      isDelivered: order.isDelivered,
      orderDate: order.createdAt
    });

  } catch (error) {
    console.error("Error checking cancellation status:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/orders/:id/refund
// @desc Process refund for a cancelled order (Admin only - you might want to add admin middleware)
// @access Private 
router.post("/:id/refund", protect, async (req, res) => {
  try {
    const { refundAmount, refundMethod, refundNotes } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== 'Cancel' || !order.isPaid) {
      return res.status(400).json({ 
        message: "Order must be cancelled and paid to process refund" 
      });
    }

    // Process the refund using the model method
    await order.processRefund({
      refundAmount: refundAmount || order.totalPrice,
      refundMethod: refundMethod || 'original_payment_method',
      refundNotes: refundNotes || 'Refund processed for cancelled order'
    });

    res.json({
      success: true,
      message: "Refund processed successfully",
      refundDetails: order.refundDetails
    });

  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/orders/:id/refund-status
// @desc Get refund status for an order
// @access Private
router.get("/:id/refund-status", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure user can only check their own orders
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }

    res.json({
      orderId: order._id,
      refundStatus: order.refundStatus,
      refundDetails: order.refundDetails,
      isCancelled: order.isCancelled,
      cancelledAt: order.cancelledAt
    });

  } catch (error) {
    console.error("Error checking refund status:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Helper function to initiate refund (implement based on your payment gateway)
async function initiateRefund(transactionId, amount) {
  // This is a placeholder - implement actual refund logic for your payment gateway
  // For SSLCommerz, you would use their refund API
  
  console.log(`Initiating refund for transaction ${transactionId}, amount: ${amount}`);
  
  try {
    // Example SSLCommerz refund call (adjust based on actual API)
    // const SSLCommerzPayment = require('sslcommerz-lts');
    // const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    // const refundResult = await sslcz.refund({
    //   refund_amount: amount,
    //   tran_id: transactionId,
    //   refund_remarks: 'Order cancellation refund'
    // });
    
    // For now, return a mock success response
    return {
      success: true,
      refundId: `REF_${Date.now()}`,
      message: 'Refund initiated successfully'
    };
    
  } catch (error) {
    console.error('Refund initiation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = router;