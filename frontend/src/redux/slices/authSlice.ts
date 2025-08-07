import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define types based on MongoDB User schema
interface User {
  _id?: string; // MongoDB uses _id, optional for flexibility
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt?: string; // Optional timestamp fields
  updatedAt?: string;
  // Note: password is excluded from API responses via toJSON method in schema
}

interface LoginUserData {
  email: string;
  password: string;
}

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  // Add other registration fields as needed
}

interface AuthState {
  user: User | null;
  guestId: string;
  loading: boolean;
  error: string | null;
}

interface ApiResponse {
  user: User;
  token: string;
}

interface ApiError {
  message: string;
  errors?: { [field: string]: string }; // For validation errors
  status?: number;
}

// Retrieve user info and token from localStorage if available
const userFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo")!)
  : null;

// Check for an existing guest ID in the localStorage or generate a new one
// Fixed typo: "gusestId" -> "guestId"
const initialGuestId =
  localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

// Initial state
const initialState: AuthState = {
  user: userFromStorage,
  guestId: initialGuestId,
  loading: false,
  error: null,
};

// Async Thunk for User Login
export const loginUser = createAsyncThunk<
  User, // Return type
  LoginUserData, // Argument type
  { rejectValue: string } // ThunkAPI type
>(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
        userData
      );

      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);

      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle different types of API errors
        if (error.response?.data) {
          const apiError = error.response.data as ApiError;
          // Handle validation errors or general API errors
          return rejectWithValue(apiError.message || "Login failed");
        }
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unexpected error occurred during login");
    }
  }
);

// Async Thunk for User Registration
export const registerUser = createAsyncThunk<
  User, // Return type
  RegisterUserData, // Argument type
  { rejectValue: string } // ThunkAPI type
>(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        userData
      );

      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);

      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle different types of API errors
        if (error.response?.data) {
          const apiError = error.response.data as ApiError;
          // Handle validation errors (like password strength, email format, etc.)
          return rejectWithValue(apiError.message || "Registration failed");
        }
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unexpected error occurred during registration");
    }
  }
);

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.guestId = `guest_${new Date().getTime()}`; // Reset guest ID on logout
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userToken");
      localStorage.setItem("guestId", state.guestId); // Set new guest ID in localStorage
    },
    generateNewGuestId: (state) => {
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.setItem("guestId", state.guestId);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload; // Fixed: should set user, not error
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload; // Fixed: should set user, not error
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      });
  },
});

export const { logout, generateNewGuestId, clearError } = authSlice.actions;
export default authSlice.reducer;