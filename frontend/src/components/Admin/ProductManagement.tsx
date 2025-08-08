import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminProducts,
  deleteProduct,
} from "../../redux/slices/adminProductSlice";

// Updated Product interface to match the schema
interface Product {
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
  images: { url: string; altText?: string }[];
  isFeatured: boolean;
  isPublished: boolean;
  rating: number;
  numReviews: number;
  tags: string[];
  user: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface RootState {
  adminProducts: {
    products: Product[];
    loading: boolean;
    error: string | null;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;
  };
}

const ProductManagement = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const itemsPerPage = 10;

  const { products, loading, error, deleteLoading } = useSelector(
    (state: RootState) => state.adminProducts
  );

  useEffect(() => {
    dispatch(fetchAdminProducts() as any);
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [dispatch, location.state]);

  useEffect(() => {
    const shouldRefetch =
      location.state?.refetch || location.pathname === "/admin/products";
    if (shouldRefetch && products.length > 0) {
      dispatch(fetchAdminProducts() as any);
    }
  }, [location, dispatch, products.length]);

  const handleDeleteClick = async (id: string, productName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      try {
        const resultAction = await dispatch(deleteProduct(id) as any);
        if (deleteProduct.fulfilled.match(resultAction)) {
          setSuccessMessage("Product deleted successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          const errorMessage =
            resultAction.payload || "Failed to delete product";
          console.error("Failed to delete product:", errorMessage);
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  // Get unique values for filters
  const categories = [
    ...new Set(products?.map((product) => product.category).filter(Boolean)),
  ];
  const brands = [
    ...new Set(products?.map((product) => product.brand).filter(Boolean)),
  ];
  const collections = [
    ...new Set(products?.map((product) => product.collections).filter(Boolean)),
  ];

  // Filter and search products
  const filteredProducts =
    products?.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.collections?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      
      const matchesBrand =
        brandFilter === "all" || product.brand === brandFilter;
      
      const matchesCollection =
        collectionFilter === "all" || product.collections === collectionFilter;
      
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && product.countInStock < 10) ||
        (stockFilter === "out" && product.countInStock === 0) ||
        (stockFilter === "in" && product.countInStock > 0);
      
      const matchesPublished =
        publishedFilter === "all" ||
        (publishedFilter === "published" && product.isPublished) ||
        (publishedFilter === "draft" && !product.isPublished);
      
      const matchesGender =
        genderFilter === "all" || product.gender === genderFilter;

      return matchesSearch && 
             matchesCategory && 
             matchesBrand && 
             matchesCollection && 
             matchesStock && 
             matchesPublished && 
             matchesGender;
    }) || [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case "price":
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case "stock":
        aValue = a.countInStock || 0;
        bValue = b.countInStock || 0;
        break;
      case "category":
        aValue = a.category || "";
        bValue = b.category || "";
        break;
      case "brand":
        aValue = a.brand || "";
        bValue = b.brand || "";
        break;
      case "collection":
        aValue = a.collections || "";
        bValue = b.collections || "";
        break;
      case "rating":
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
        break;
      default:
        aValue = a.name || "";
        bValue = b.name || "";
    }
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock < 10)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getPublishedStatus = (isPublished: boolean) => {
    return isPublished 
      ? { text: "Published", color: "bg-green-100 text-green-800" }
      : { text: "Draft", color: "bg-yellow-100 text-yellow-800" };
  };

  const handleRefresh = () => {
    dispatch(fetchAdminProducts() as any);
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error loading products: {error}</div>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-800">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Product Management
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Refresh products"
            >
              <svg
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
          </div>
          <Link
            to="/admin/products/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add New Product
          </Link>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products by name, SKU, category, brand, or collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Brand:</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Collection:</label>
              <select
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All Collections</option>
                {collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Stock:</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All Stock Levels</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock (&lt;10)</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Published:</label>
              <select
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Gender:</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All Genders</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="category">Category</option>
                <option value="brand">Brand</option>
                <option value="collection">Collection</option>
                <option value="rating">Rating</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>
            
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Brand</th>
              <th className="px-6 py-3">Collection</th>
              <th className="px-6 py-3">Gender</th>
              <th className="px-6 py-3">Published</th>
              <th className="px-6 py-3">Rating</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => {
                const stockStatus = getStockStatus(product.countInStock);
                const publishedStatus = getPublishedStatus(product.isPublished);
                return (
                  <tr
                    key={product._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].altText || product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-500 text-xs">No Image</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {product.discountPrice ? (
                        <div>
                          <span className="line-through text-gray-500">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="ml-2 font-semibold text-red-600">
                            ${product.discountPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span>${product.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          product.countInStock < 10 ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {product.countInStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {product.brand || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {product.collections}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {product.gender || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${publishedStatus.color}`}
                      >
                        {publishedStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span>{product.rating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1">({product.numReviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                      >
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-2">
                        <Link
                          to={`/product/${product._id}`}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                          title="View Details"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                          title="Edit Product"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() =>
                            handleDeleteClick(product._id, product.name)
                          }
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                          disabled={deleteLoading}
                          title="Delete Product"
                        >
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-400 mb-1">
                      No products found
                    </p>
                    <p className="text-sm text-gray-400">
                      {searchTerm ||
                      categoryFilter !== "all" ||
                      brandFilter !== "all" ||
                      collectionFilter !== "all" ||
                      stockFilter !== "all" ||
                      publishedFilter !== "all" ||
                      genderFilter !== "all"
                        ? "Try adjusting your filters or search terms"
                        : "Get started by adding your first product"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, sortedProducts.length)} of{" "}
            {sortedProducts.length} results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium border ${
                  currentPage === page
                    ? "text-blue-600 bg-blue-50 border-blue-500"
                    : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Summary Stats */}
      {products && products.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-2xl font-bold text-gray-900">
              {products.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-gray-900">
              $
              {products
                .reduce(
                  (sum, product) =>
                    sum + (product.price || 0) * (product.countInStock || 0),
                  0
                )
                .toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Low Stock Items</div>
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter((product) => (product.countInStock || 0) < 10).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Out of Stock</div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((product) => (product.countInStock || 0) === 0).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Published</div>
            <div className="text-2xl font-bold text-green-600">
              {products.filter((product) => product.isPublished).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Drafts</div>
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter((product) => !product.isPublished).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;