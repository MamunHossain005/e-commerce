import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { updateProduct, fetchAdminProducts } from "../../redux/slices/adminProductSlice";
import axios from "axios";

interface ProductImage {
  url: string;
  altText?: string;
}

interface ProductData {
  _id?: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  countInStock: number;
  sku: string;
  category: string;
  brand: string;
  sizes: string[];
  colors: string[];
  collections: string;
  material: string;
  gender: string;
  images: ProductImage[];
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  weight?: number;
}

interface RootState {
  adminProducts: {
    products: ProductData[];
    loading: boolean;
    error: string | null;
  };
}

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { products, loading } = useSelector((state: RootState) => state.adminProducts);
  
  const [productData, setProductData] = useState<ProductData>({
    name: "",
    description: "",
    price: 0,
    discountPrice: undefined,
    countInStock: 0,
    sku: "",
    category: "",
    brand: "",
    sizes: [],
    colors: [],
    collections: "",
    material: "",
    gender: "",
    images: [],
    isFeatured: false,
    isPublished: false,
    tags: [],
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    dimensions: {
      length: undefined,
      width: undefined,
      height: undefined,
    },
    weight: undefined,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchAdminProducts() as any);
    }
  }, [dispatch, products.length]);

  useEffect(() => {
    if (products.length > 0 && id) {
      const product = products.find(p => p._id === id);
      if (product) {
        setProductData({
          _id: product._id,
          name: product.name || "",
          description: product.description || "",
          price: product.price || 0,
          discountPrice: product.discountPrice || undefined,
          countInStock: product.countInStock || 0,
          sku: product.sku || "",
          category: product.category || "",
          brand: product.brand || "",
          sizes: product.sizes || [],
          colors: product.colors || [],
          collections: product.collections || "",
          material: product.material || "",
          gender: product.gender || "",
          images: product.images || [],
          isFeatured: product.isFeatured || false,
          isPublished: product.isPublished || false,
          tags: product.tags || [],
          metaTitle: product.metaTitle || "",
          metaDescription: product.metaDescription || "",
          metaKeywords: product.metaKeywords || "",
          dimensions: product.dimensions || {
            length: undefined,
            width: undefined,
            height: undefined,
          },
          weight: product.weight || undefined,
        });
      }
    }
  }, [products, id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setProductData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name.startsWith("dimensions.")) {
      const field = name.split(".")[1];
      setProductData((prev) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [field]: value ? Number(value) : undefined,
        },
      }));
    } else {
      setProductData((prev) => ({
        ...prev,
        [name]:
          name === "price" ||
          name === "discountPrice" ||
          name === "countInStock" ||
          name === "weight"
            ? Number(value) || undefined
            : value,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setSubmitError("Please select a valid image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Image size should be less than 5MB");
      return;
    }
    
    setUploadingImage(true);
    setSubmitError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      setProductData(prev => ({
        ...prev,
        images: [...prev.images, { url: response.data.imageUrl }]
      }));
      e.target.value = "";
    } catch (error: any) {
      console.error("Image upload error:", error);
      setSubmitError(error.response?.data?.message || error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await dispatch(updateProduct({ 
        id, 
        productData
      }) as any);
      
      navigate("/admin/products", { state: { refetch: true } });
    } catch (error: any) {
      setSubmitError(error.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!productData._id && products.length > 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md bg-white">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-bold">Edit Product</h2>
      </div>
      
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{submitError}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label htmlFor="name" className="block font-semibold mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={productData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="sku" className="block font-semibold mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                id="sku"
                value={productData.sku}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="brand" className="block font-semibold mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                value={productData.brand}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="category" className="block font-semibold mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                id="category"
                value={productData.category}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={productData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-md h-32 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Pricing and Inventory */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Pricing & Inventory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label htmlFor="price" className="block font-semibold mb-2">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="price"
                  id="price"
                  value={productData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="discountPrice" className="block font-semibold mb-2">
                Discount Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="discountPrice"
                  id="discountPrice"
                  value={productData.discountPrice || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="countInStock" className="block font-semibold mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="countInStock"
                id="countInStock"
                value={productData.countInStock}
                onChange={handleChange}
                min="0"
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="weight" className="block font-semibold mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                id="weight"
                value={productData.weight || ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Attributes */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Attributes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label htmlFor="material" className="block font-semibold mb-2">
                Material
              </label>
              <input
                type="text"
                name="material"
                id="material"
                value={productData.material}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="collections" className="block font-semibold mb-2">
                Collections
              </label>
              <input
                type="text"
                name="collections"
                id="collections"
                value={productData.collections}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="gender" className="block font-semibold mb-2">
                Gender
              </label>
              <select
                name="gender"
                id="gender"
                value={productData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
                <option value="kids">Kids</option>
              </select>
            </div>
          </div>
          
          {/* Sizes */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">
              Sizes (comma separated)
            </label>
            <input
              type="text"
              value={productData.sizes.join(", ")}
              onChange={(e) =>
                setProductData({
                  ...productData,
                  sizes: e.target.value.split(",").map((size) => size.trim()).filter(size => size !== ""),
                })
              }
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., S, M, L, XL"
            />
          </div>
          
          {/* Colors */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">
              Colors (comma separated)
            </label>
            <input
              type="text"
              value={productData.colors.join(", ")}
              onChange={(e) =>
                setProductData({
                  ...productData,
                  colors: e.target.value
                    .split(",")
                    .map((color) => color.trim()).filter(color => color !== ""),
                })
              }
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Red, Blue, Green"
            />
          </div>
          
          {/* Dimensions */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">Dimensions (cm)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="dimensions.length"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Length
                </label>
                <input
                  type="number"
                  name="dimensions.length"
                  id="dimensions.length"
                  value={productData.dimensions?.length || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="dimensions.width"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Width
                </label>
                <input
                  type="number"
                  name="dimensions.width"
                  id="dimensions.width"
                  value={productData.dimensions?.width || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="dimensions.height"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Height
                </label>
                <input
                  type="number"
                  name="dimensions.height"
                  id="dimensions.height"
                  value={productData.dimensions?.height || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Images */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Product Images
          </h3>
          <div className="mb-4">
            <label htmlFor="image" className="block font-semibold mb-2">
              Upload New Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                  uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingImage ? (
                    <>
                      <div className="w-8 h-8 mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">
                        Uploading image...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 mb-4 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or GIF (MAX. 5MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </div>
          
          {productData.images.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">
                Uploaded Images ({productData.images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {productData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Product Image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove image"
                    >
                      ×
                    </button>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={image.altText || ""}
                        onChange={(e) => {
                          const newImages = [...productData.images];
                          newImages[index].altText = e.target.value;
                          setProductData((prev) => ({
                            ...prev,
                            images: newImages,
                          }));
                        }}
                        placeholder="Alt text"
                        className="w-full p-1 text-xs border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* SEO Fields */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            SEO Information
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="mb-4">
              <label htmlFor="metaTitle" className="block font-semibold mb-2">
                Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                id="metaTitle"
                value={productData.metaTitle || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="SEO title"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="metaDescription" className="block font-semibold mb-2">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                id="metaDescription"
                value={productData.metaDescription || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md h-24 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SEO description"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="metaKeywords" className="block font-semibold mb-2">
                Meta Keywords
              </label>
              <input
                type="text"
                name="metaKeywords"
                id="metaKeywords"
                value={productData.metaKeywords || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        </div>
        
        {/* Publishing Options */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Publishing Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  id="isFeatured"
                  checked={productData.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 font-medium">Featured Product</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublished"
                  id="isPublished"
                  checked={productData.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 font-medium">Published</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Tags</h3>
          <div className="mb-4">
            <label htmlFor="tags" className="block font-semibold mb-2">
              Product Tags (comma separated)
            </label>
            <input
              type="text"
              value={productData.tags.join(", ")}
              onChange={(e) =>
                setProductData({
                  ...productData,
                  tags: e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag !== ""),
                })
              }
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., new, summer, sale"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate tags with commas.
            </p>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="mr-2" />
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;