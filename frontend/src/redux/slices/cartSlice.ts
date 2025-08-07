import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Define interfaces based on the MongoDB schema
interface CartItem {
  productId: string;
  name?: string;
  image?: string;
  price?: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface Cart {
  _id?: string;
  user?: string;
  guestId?: string;
  products: CartItem[];
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to load cart from localStorage
const localCartFromStorage = (): Cart => {
  try {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : { products: [], totalPrice: 0 };
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return { products: [], totalPrice: 0 };
  }
};

// Helper function to save cart to localStorage
const saveCartToStorage = (cart: Cart) => {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

// Fetch cart for a user or guest
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ userId, guestId }: { userId?: string; guestId?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          params: { userId, guestId },
        }
      );
      return response.data as Cart;
    } catch (error: any) {
      console.error("Fetch cart error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch cart"
      );
    }
  }
);

// Add an item to the cart for a user or guest
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (
    { 
      productId, 
      quantity, 
      size, 
      color, 
      guestId, 
      userId,
      name,
      image,
      price
    }: {
      productId: string;
      quantity: number;
      size?: string;
      color?: string;
      guestId?: string;
      userId?: string;
      name?: string;
      image?: string;
      price?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          productId,
          quantity,
          size,
          color,
          guestId,
          userId,
          name,
          image,
          price,
        }
      );
      return response.data as Cart;
    } catch (error: any) {
      console.error("Add to cart error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to add to cart"
      );
    }
  }
);

// Update the quantity of an item in the cart
export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async (
    { 
      productId, 
      quantity, 
      guestId, 
      userId, 
      size, 
      color 
    }: {
      productId: string;
      quantity: number;
      guestId?: string;
      userId?: string;
      size?: string;
      color?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          productId,
          quantity,
          guestId,
          userId,
          size,
          color,
        }
      );
      return response.data as Cart;
    } catch (error: any) {
      console.error("Update cart item quantity error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update item quantity"
      );
    }
  }
);

// Remove an item from the cart
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (
    { 
      productId, 
      guestId, 
      userId, 
      size, 
      color 
    }: {
      productId: string;
      guestId?: string;
      userId?: string;
      size?: string;
      color?: string;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await axios({
        method: "DELETE",
        url: `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        data: { productId, guestId, userId, size, color },
      });
      return response.data as Cart;
    } catch (error: any) {
      console.error("Remove from cart error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to remove item"
      );
    }
  }
);

// Merge guest cart into user cart
export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async (
    { 
      guestId, 
      user 
    }: {
      guestId: string;
      user: any;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/merge`,
        { guestId, user },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data as Cart;
    } catch (error: any) {
      console.error("Merge cart error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to merge cart"
      );
    }
  }
);

interface CartState {
  cart: Cart;
  loading: boolean;
  error: string | null;
}

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: localCartFromStorage(),
    loading: false,
    error: null,
  } as CartState,
  reducers: {
    clearCart: (state) => {
      state.cart = { products: [], totalPrice: 0 };
      state.error = null;
      try {
        localStorage.removeItem("cart");
      } catch (error) {
        console.error("Error clearing cart from localStorage:", error);
      }
    },
    // Add a reducer to clear errors
    clearError: (state) => {
      state.error = null;
    },
    // Local calculation of total price (useful for offline scenarios)
    calculateTotalPrice: (state) => {
      state.cart.totalPrice = state.cart.products.reduce((total, item) => {
        const itemPrice = parseFloat(item.price || "0");
        return total + (itemPrice * item.quantity);
      }, 0);
      saveCartToStorage(state.cart);
    },
    // Update cart locally without API call (useful for optimistic updates)
    updateCartLocally: (state, action) => {
      state.cart = { ...state.cart, ...action.payload };
      saveCartToStorage(state.cart);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart cases
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch cart";
      })
      // Add to cart cases
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to add to cart";
      })
      // Update cart item quantity cases
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update item quantity";
      })
      // Remove from cart cases
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to remove item";
      })
      // Merge cart cases
      .addCase(mergeCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
      })
      .addCase(mergeCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to merge cart";
      });
  },
});

export const { clearCart, clearError, calculateTotalPrice, updateCartLocally } = cartSlice.actions;
export default cartSlice.reducer;