import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Interface for product images
interface ProductImage {
  url: string;
  altText?: string;
}

// Interface for product dimensions
interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
}

// Main Product interface based on your Mongoose schema
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  countInStock: number;
  sku: string;
  category: string;
  brand?: string;
  sizes: string[];
  colors: string[];
  collections: string;
  material?: string;
  gender?: "Men" | "Women" | "Unisex";
  images: ProductImage[];
  isFeatured: boolean;
  isPublished: boolean;
  rating: number;
  numReviews: number;
  tags?: string[];
  user: string; // Assuming this is the user ID
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  dimensions?: ProductDimensions;
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Filter parameters interface
interface FilterParams {
  collection?: string;
  size?: string;
  color?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  search?: string;
  category?: string;
  material?: string;
  brand?: string;
  limit?: string;
}

// State interface
interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  similarProducts: Product[];
  loading: boolean;
  error: string | null;
  filters: {
    category: string;
    size: string;
    color: string;
    gender: string;
    brand: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    search: string;
    material: string;
    collection: string;
  };
}

// Initial state
const initialState: ProductsState = {
  products: [],
  selectedProduct: null,
  similarProducts: [],
  loading: false,
  error: null,
  filters: {
    category: "",
    size: "",
    color: "",
    gender: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "",
    search: "",
    material: "",
    collection: "",
  },
};

// Async thunks with proper typing
export const fetchProductsByFilters = createAsyncThunk<Product[], FilterParams>(
  "products/fetchByFilters",
  async (filterParams) => {
    const query = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });

    const response = await axios.get<Product[]>(
      `${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`
    );
    return response.data;
  }
);

export const fetchProductDetails = createAsyncThunk<Product, string>(
  "products/fetchProductDetails",
  async (id) => {
    const response = await axios.get<Product>(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`
    );
    return response.data;
  }
);

export const updateProduct = createAsyncThunk<
  Product,
  { id: string; productData: Partial<Product> }
>(
  "products/updateProduct",
  async ({ id, productData }) => {
    const response = await axios.put<Product>(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`,
      productData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      }
    );
    return response.data;
  }
);

export const fetchSimilarProducts = createAsyncThunk<Product[], { id: string }>(
  "products/fetchSimilarProducts",
  async ({ id }) => {
    const response = await axios.get<Product[]>(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/similar/${id}`
    );
    return response.data;
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters: (state, action: { payload: Partial<ProductsState['filters']> }) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch products";
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch product details";
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        
        // Update in products array
        const index = state.products.findIndex(p => p._id === updatedProduct._id);
        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
        
        // Update selected product if it's the same
        if (state.selectedProduct?._id === updatedProduct._id) {
          state.selectedProduct = updatedProduct;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update product";
      })
      .addCase(fetchSimilarProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.similarProducts = action.payload;
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch similar products";
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;