import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Define interfaces based on the MongoDB schema
interface CheckoutItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface CustomerInfo {
  email: string;
  phone: string;
}

interface CheckoutData {
  user: string;
  checkoutItems: CheckoutItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalPrice: number;
  customerInfo?: CustomerInfo;
  orderNotes?: string;
  // Optional fields for updates
  isPaid?: boolean;
  paidAt?: string;
  paymentStatus?: string;
  paymentDetails?: any;
  isFinalized?: boolean;
  finalizedAt?: string;
}

interface CheckoutResponse {
  _id: string;
  user: string;
  checkoutItems: CheckoutItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalPrice: number;
  customerInfo?: CustomerInfo;
  orderNotes?: string;
  isPaid: boolean;
  paidAt?: string;
  paymentStatus: string;
  paymentDetails?: any;
  isFinalized: boolean;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
  // SSLCommerz specific fields
  sessionId?: string;
  paymentUrl?: string;
  sslTransactionId?: string;
}

interface SSLCommerzInitResponse {
  status: string;
  GatewayPageURL?: string;
  sessionkey?: string;
  message?: string;
}

interface CheckoutState {
  checkout: CheckoutResponse | null;
  loading: boolean;
  error: string | null;
}

// Async thunk to create a checkout session
export const createCheckout = createAsyncThunk(
  "checkout/createCheckout",
  async (checkoutdata: CheckoutData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout`,
        checkoutdata,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data as CheckoutResponse;
    } catch (error: any) {
      console.error("Checkout error:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to create checkout session"
      );
    }
  }
);

// Async thunk to initialize SSLCommerz payment
export const initializeSSLCommerzPayment = createAsyncThunk(
  "checkout/initializeSSLCommerzPayment",
  async (paymentData: any, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/sslcommerz/init`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data as SSLCommerzInitResponse;
    } catch (error: any) {
      console.error("SSLCommerz initialization error:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to initialize SSLCommerz payment"
      );
    }
  }
);

// Async thunk to get checkout by ID
export const getCheckout = createAsyncThunk(
  "checkout/getCheckout",
  async (checkoutId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data as CheckoutResponse;
    } catch (error: any) {
      console.error("Get checkout error:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch checkout"
      );
    }
  }
);

// Async thunk to verify SSLCommerz payment
export const verifySSLCommerzPayment = createAsyncThunk(
  "checkout/verifySSLCommerzPayment",
  async (
    { 
      checkoutId, 
      transactionId, 
      paymentData 
    }: {
      checkoutId: string;
      transactionId: string;
      paymentData: any;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/sslcommerz/verify`,
        {
          checkoutId,
          transactionId,
          paymentData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data as CheckoutResponse;
    } catch (error: any) {
      console.error("SSLCommerz verification error:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to verify SSLCommerz payment"
      );
    }
  }
);

// Async thunk to update payment status
export const updatePaymentStatus = createAsyncThunk(
  "checkout/updatePaymentStatus",
  async (
    { 
      checkoutId, 
      isPaid, 
      paymentStatus, 
      paymentDetails,
      transactionId 
    }: {
      checkoutId: string;
      isPaid: boolean;
      paymentStatus: string;
      paymentDetails?: any;
      transactionId?: string;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/payment`,
        {
          isPaid,
          paymentStatus,
          paymentDetails,
          transactionId,
          paidAt: isPaid ? new Date().toISOString() : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data as CheckoutResponse;
    } catch (error: any) {
      console.error("Update payment status error:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to update payment status"
      );
    }
  }
);

// Async thunk to finalize checkout
export const finalizeCheckout = createAsyncThunk(
  "checkout/finalizeCheckout",
  async (checkoutId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/finalize`,
        {
          isFinalized: true,
          finalizedAt: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data as CheckoutResponse;
    } catch (error: any) {
      console.error("Finalize checkout error:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to finalize checkout"
      );
    }
  }
);

const checkoutSlice = createSlice({
  name: "checkout",
  initialState: {
    checkout: null,
    loading: false,
    error: null,
  } as CheckoutState,
  reducers: {
    // Clear checkout state
    clearCheckout: (state) => {
      state.checkout = null;
      state.error = null;
    },
    // Clear checkout errors
    clearCheckoutError: (state) => {
      state.error = null;
    },
    // Reset checkout state
    resetCheckout: (state) => {
      state.checkout = null;
      state.loading = false;
      state.error = null;
    },
    // Update checkout with SSLCommerz session info
    updateCheckoutSession: (state, action) => {
      if (state.checkout) {
        state.checkout.sessionId = action.payload.sessionId;
        state.checkout.paymentUrl = action.payload.paymentUrl;
        state.checkout.sslTransactionId = action.payload.transactionId;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create checkout cases
      .addCase(createCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
        state.error = null;
      })
      .addCase(createCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create checkout session";
      })
      // Initialize SSLCommerz payment cases
      .addCase(initializeSSLCommerzPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSSLCommerzPayment.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // SSLCommerz initialization successful, payment URL will be used to redirect
      })
      .addCase(initializeSSLCommerzPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to initialize SSLCommerz payment";
      })
      // Get checkout cases
      .addCase(getCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
        state.error = null;
      })
      .addCase(getCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch checkout";
      })
      // Verify SSLCommerz payment cases
      .addCase(verifySSLCommerzPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifySSLCommerzPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
        state.error = null;
      })
      .addCase(verifySSLCommerzPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to verify payment";
      })
      // Update payment status cases
      .addCase(updatePaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
        state.error = null;
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update payment status";
      })
      // Finalize checkout cases
      .addCase(finalizeCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizeCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
        state.error = null;
      })
      .addCase(finalizeCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to finalize checkout";
      });
  },
});

export const { 
  clearCheckout, 
  clearCheckoutError, 
  resetCheckout, 
  updateCheckoutSession 
} = checkoutSlice.actions;

export default checkoutSlice.reducer;