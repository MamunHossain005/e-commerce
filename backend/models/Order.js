const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    size: String,
    color: String,
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    customerInfo: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled", "Refunded"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancel"],
      default: "Processing",
    },
    orderNotes: String,
    paymentDetails: {
      transactionId: String,
      validationId: String,
      amount: Number,
      cardType: String,
      storeAmount: Number,
      cardNo: String,
      bankTransactionId: String,
      status: String,
      transactionDate: Date,
    },
    // Cancellation fields
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ["customer", "admin", "system"],
      default: "customer",
    },
    refundStatus: {
      type: String,
      enum: ["pending", "initiated", "completed", "failed", "not_applicable"],
      default: "not_applicable",
    },
    refundDetails: {
      refundId: String,
      refundAmount: Number,
      refundedAt: Date,
      refundMethod: String,
      refundNotes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ "paymentDetails.transactionId": 1 });

// Virtual for checking if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  // Cannot cancel if already delivered
  if (this.isDelivered) return false;
  
  // Cannot cancel if already cancelled
  if (this.status === 'Cancel' || this.paymentStatus === 'Cancelled') return false;
  
  // Cannot cancel if no transaction ID and order is paid (needed for refund)
  if (!this.paymentDetails?.transactionId && this.isPaid) return false;
  
  // Check 24-hour window
  const hoursDiff = (new Date() - this.createdAt) / (1000 * 60 * 60);
  return hoursDiff <= 24;
});

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason, cancelledBy = 'customer') {
  this.status = 'Cancel';
  this.isCancelled = true;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  
  // Update payment status based on whether it was paid
  if (this.isPaid) {
    this.paymentStatus = 'Cancelled';
    this.refundStatus = 'pending';
  } else {
    this.paymentStatus = 'Cancelled';
    this.refundStatus = 'not_applicable';
  }
  
  return this.save();
};

// Method to process refund
orderSchema.methods.processRefund = function(refundDetails) {
  this.refundStatus = 'completed';
  this.refundDetails = {
    ...this.refundDetails,
    ...refundDetails,
    refundedAt: new Date()
  };
  
  return this.save();
};

// Pre-save middleware to update isCancelled based on status
orderSchema.pre('save', function(next) {
  if (this.status === 'Cancel') {
    this.isCancelled = true;
    if (!this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);