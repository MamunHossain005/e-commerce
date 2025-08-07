const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema({
  productId: {
    type: String,
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
  quantity: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
  },
  color: {
    type: String,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: "BD", // Default to Bangladesh
  },
});

const customerInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true, // Required for SSLCommerz
  },
});

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    checkoutItems: [checkoutItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    customerInfo: {
      type: customerInfoSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "SSLCommerz",
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    orderNotes: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: [
        "Pending",
        "Initiated",
        "Processing",
        "Completed",
        "Failed",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
    },
    paymentDetails: {
      // SSLCommerz specific fields
      transactionId: String, // tran_id from SSLCommerz
      validationId: String, // val_id from SSLCommerz
      amount: Number, // Transaction amount
      currency: {
        type: String,
        default: "BDT",
      },
      cardType: String, // Card type (Visa, MasterCard, etc.)
      cardNo: String, // Masked card number
      bankTransactionId: String, // Bank transaction ID
      storeAmount: Number, // Store amount after gateway fee
      status: String, // Payment status from gateway
      transactionDate: Date, // Transaction date from gateway
      validationResponse: mongoose.Schema.Types.Mixed, // Full validation response
      ipnValidation: mongoose.Schema.Types.Mixed, // IPN validation data
      ipnReceivedAt: Date, // When IPN was received
      error: String, // Error message if payment failed
      failedAt: Date, // When payment failed
      cancelledAt: Date, // When payment was cancelled
    },
    sslTransactionId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    },
    isFinalized: {
      type: Boolean,
      required: true,
      default: false,
    },
    finalizedAt: {
      type: Date,
    },
    // Metadata for tracking
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    // Additional tracking fields
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    // Currency conversion rate (if needed)
    exchangeRate: {
      type: Number,
      default: 85, // Default USD to BDT rate
    },
    amountInBDT: {
      type: Number,
    },
    // Webhook/callback tracking
    callbacksReceived: [
      {
        type: {
          type: String,
          enum: ["success", "fail", "cancel", "ipn"],
        },
        receivedAt: {
          type: Date,
          default: Date.now,
        },
        data: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true, // This will automatically manage createdAt and updatedAt
  }
);

// Indexes for better query performance
checkoutSchema.index({ user: 1, createdAt: -1 });
checkoutSchema.index({ sslTransactionId: 1 });
checkoutSchema.index({ paymentStatus: 1 });
checkoutSchema.index({ isPaid: 1, isFinalized: 1 });

// Pre-save middleware to calculate BDT amount
checkoutSchema.pre("save", function (next) {
  if (this.totalPrice && this.exchangeRate) {
    this.amountInBDT = Math.round(this.totalPrice * this.exchangeRate);
  }
  next();
});

// Virtual for full customer name
checkoutSchema.virtual("customerName").get(function () {
  return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
});

// Virtual for formatted total price in BDT
checkoutSchema.virtual("totalPriceBDT").get(function () {
  return (
    this.amountInBDT || Math.round(this.totalPrice * (this.exchangeRate || 85))
  );
});

// Method to check if payment is successful
checkoutSchema.methods.isPaymentSuccessful = function () {
  return (
    this.isPaid &&
    (this.paymentStatus === "Completed" ||
      this.paymentStatus === "Processing") &&
    this.paymentDetails &&
    this.paymentDetails.transactionId
  );
};

// Method to get payment summary
checkoutSchema.methods.getPaymentSummary = function () {
  return {
    checkoutId: this._id,
    transactionId: this.sslTransactionId,
    amount: this.totalPrice,
    amountBDT: this.totalPriceBDT,
    currency: this.paymentDetails?.currency || "BDT",
    status: this.paymentStatus,
    isPaid: this.isPaid,
    paymentMethod: this.paymentMethod,
    paidAt: this.paidAt,
    customerName: this.customerName,
    customerEmail: this.customerInfo.email,
    customerPhone: this.customerInfo.phone,
  };
};

// Static method to find checkout by SSLCommerz transaction ID
checkoutSchema.statics.findBySSLTransactionId = function (transactionId) {
  return this.findOne({ sslTransactionId: transactionId });
};

// Static method to get user's recent checkouts
checkoutSchema.statics.getUserRecentCheckouts = function (userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "name email");
};

const Checkout = mongoose.model("Checkout", checkoutSchema);

module.exports = Checkout;
