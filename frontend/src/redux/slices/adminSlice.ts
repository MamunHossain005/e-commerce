import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}`;
const getUserToken = () => `Bearer ${localStorage.getItem("userToken")}`;

// fetch all users (admin only)
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers", 
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/users`,
        {
          headers: {
            Authorization: getUserToken(),
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add the create user action
export const addUser = createAsyncThunk(
  "admin/addUser",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/users`,
        userData,
        {
          headers: {
            Authorization: getUserToken(),
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// update a user (admin only)
export const updateUser = createAsyncThunk(
  "admin/updateUser",
  async (
    { id, name, email, role }: { id: string; name: string; email: string; role: string }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${id}`,
        { name, email, role },
        {
          headers: {
            Authorization: getUserToken(),
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete a user
export const deleteUser = createAsyncThunk(
  "admin/deleteUser", 
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${API_URL}/api/admin/users/${id}`,
        {
          headers: {
            Authorization: getUserToken(),
          },
        }
      );
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

interface AdminUserState {
  users: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminUserState = {
  users: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add User
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both response formats - sometimes the user is nested, sometimes it's direct
        const newUser = action.payload.user || action.payload;
        state.users.push(newUser);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload.user || action.payload;
        const userIndex = state.users.findIndex(
          (user) => user._id === updatedUser._id
        );
        if (userIndex !== -1) {
          state.users[userIndex] = updatedUser;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;