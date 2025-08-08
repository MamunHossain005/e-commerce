import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import {
  fetchProductDetails,
  fetchSimilarProducts,
} from "../../redux/slices/productsSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import type { Variants } from "framer-motion";

const ProductDetails = ({ productId }: { productId?: string }) => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedProduct, loading, error, similarProducts } = useSelector(
    (state: RootState) => state.products
  );
  const { user, guestId } = useSelector((state: RootState) => state.auth);
  // Initialize with null/empty values and set them in useEffect
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const productFetchId = productId || id;

  // Animation variants
  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3 },
    },
  };

  const thumbnailVariants: Variants = {
    inactive: {
      scale: 1,
      opacity: 0.7,
      y: 0,
    },
    active: {
      scale: 1.05,
      opacity: 1,
      y: -2,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    hover: {
      scale: 1.1,
      y: -3,
      transition: { duration: 0.2 },
    },
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const buttonVariants: Variants = {
    initial: {
      opacity: 0,
      y: 15,
      scale: 1,
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.6, delay: 0.8 },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
      transition: { type: "spring", stiffness: 300 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
    disabled: {
      scale: 1,
      opacity: 0.6,
    },
  };

  const quantityVariants: Variants = {
    idle: { scale: 1 },
    hover: {
      scale: 1.05,
      backgroundColor: "#f3f4f6",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  };

  const colorVariants: Variants = {
    unselected: {
      scale: 1,
      borderWidth: "1px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    selected: {
      scale: 1.15,
      borderWidth: "4px",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
      transition: { type: "spring", stiffness: 400, damping: 15 },
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 },
    },
  };

  const sizeVariants: Variants = {
    unselected: {
      scale: 1,
      backgroundColor: "#ffffff",
      color: "#374151",
    },
    selected: {
      scale: 1.05,
      backgroundColor: "#000000",
      color: "#ffffff",
      transition: { type: "spring", stiffness: 300 },
    },
    hover: {
      scale: 1.02,
      backgroundColor: "#f9fafb",
      transition: { duration: 0.2 },
    },
  };

  const loadingVariants: Variants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const handleQuantityChange = (action: "plus" | "minus") => {
    if (action === "plus" && quantity < (selectedProduct?.countInStock || 0)) {
      setQuantity((prev) => prev + 1);
    } else if (action === "minus" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedColor || !selectedSize) {
      toast.error("Please select a color and size before adding to cart.", {
        duration: 1000,
      });
      return;
    }
    if (quantity > (selectedProduct?.countInStock || 0)) {
      toast.error("Not enough stock available", {
        duration: 1000,
      });
      return;
    }
    setIsButtonDisabled(true);

    try {
      await dispatch(
        addToCart({
          productId: productFetchId!,
          quantity,
          size: selectedSize,
          color: selectedColor,
          guestId,
          userId: user?._id,
        })
      ).unwrap();

      toast.success("Product added to cart!", {
        duration: 1000,
      });
    } catch (error) {
      toast.error("Failed to add product to cart", {
        duration: 1000,
      });
    } finally {
      setIsButtonDisabled(false);
    }
  };

  // Fetch product data
  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProducts({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  // Set main image when selectedProduct changes
  useEffect(() => {
    if (selectedProduct?.images && selectedProduct.images.length > 0) {
      setMainImage(selectedProduct.images[0].url);
    }
  }, [selectedProduct]);

  // Calculate discount percentage
  const discountPercentage =
    selectedProduct?.discountPrice && selectedProduct?.price
      ? Math.round(
          ((selectedProduct.price - selectedProduct.discountPrice) /
            selectedProduct.price) *
            100
        )
      : 0;

  // Get final price (discount price if available, otherwise regular price)
  const finalPrice = selectedProduct?.discountPrice || selectedProduct?.price;

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Product Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-600 text-lg">Error: {error}</p>
      </motion.div>
    );
  }

  // Add null check before rendering
  if (!selectedProduct) {
    return (
      <motion.div
        className="p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-gray-600 text-lg">Product not found</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto bg-white p-8">
        <div className="flex flex-col md:flex-row">
          {/* Left Thumbnails */}
          <motion.div
            className="hidden md:flex flex-col space-y-4 mr-6"
            variants={contentVariants}
          >
            {selectedProduct.images?.map((image, index) => (
              <motion.img
                key={index}
                src={image.url}
                alt={image.altText || `Product image ${index + 1}`}
                onClick={() => setMainImage(image.url)}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${
                  mainImage === image.url
                    ? "border-blue-500"
                    : "border-gray-300"
                }`}
                variants={thumbnailVariants}
                animate={mainImage === image.url ? "active" : "inactive"}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              />
            ))}
          </motion.div>
          {/* Main Image */}
          <motion.div className="md:w-1/2" variants={contentVariants}>
            <div className="mb-4 relative">
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium z-10">
                  -{discountPercentage}%
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.img
                  key={mainImage}
                  src={mainImage || undefined}
                  alt="Main Product"
                  className="w-full h-auto object-cover rounded-lg"
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover="hover"
                />
              </AnimatePresence>
            </div>
          </motion.div>
          {/* Mobile Thumbnails */}
          <motion.div
            className="md:hidden flex overflow-x-auto space-x-4 mb-4"
            variants={contentVariants}
          >
            {selectedProduct.images?.map((image, index) => (
              <motion.img
                key={index}
                src={image.url}
                alt={image.altText || `Thumbnail ${index + 1}`}
                onClick={() => setMainImage(image.url)}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-4 flex-shrink-0 ${
                  mainImage === image.url
                    ? "border-blue-500"
                    : "border-gray-300"
                }`}
                variants={thumbnailVariants}
                animate={mainImage === image.url ? "active" : "inactive"}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              />
            ))}
          </motion.div>
          {/* Right side */}
          <motion.div className="md:w-1/2 md:ml-10" variants={contentVariants}>
            <motion.h1
              className="text-2xl md:text-3xl font-semibold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {selectedProduct.name}
            </motion.h1>
            {/* SKU */}
            <motion.p
              className="text-sm text-gray-500 mb-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              SKU: {selectedProduct.sku}
            </motion.p>
            {/* Rating */}
            <motion.div
              className="flex items-center mb-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
            >
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < Math.floor(selectedProduct.rating || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  ({selectedProduct.numReviews || 0} reviews)
                </span>
              </div>
            </motion.div>
            {/* Price */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                <p className="text-2xl text-gray-900 font-bold">
                  ${finalPrice?.toFixed(2)}
                </p>
                {selectedProduct.discountPrice && (
                  <p className="text-lg text-gray-500 line-through">
                    ${selectedProduct.price.toFixed(2)}
                  </p>
                )}
              </div>
            </motion.div>
            {/* Stock Status */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <p
                className={`text-sm font-medium ${
                  selectedProduct.countInStock > 0
                    ? selectedProduct.countInStock < 10
                      ? "text-orange-600"
                      : "text-green-600"
                    : "text-red-600"
                }`}
              >
                {selectedProduct.countInStock > 0
                  ? selectedProduct.countInStock < 10
                    ? `Only ${selectedProduct.countInStock} left in stock!`
                    : `In Stock (${selectedProduct.countInStock} available)`
                  : "Out of Stock"}
              </p>
            </motion.div>
            <motion.p
              className="text-gray-600 mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {selectedProduct.description}
            </motion.p>
            {/* Color Selection */}
            {selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="text-gray-700 mb-2 font-medium">
                  Color:{" "}
                  {selectedColor && (
                    <span className="capitalize">{selectedColor}</span>
                  )}
                </h3>
                <div className="flex gap-3">
                  {selectedProduct.colors.map((color) => (
                    <motion.button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="w-8 h-8 rounded-full border-gray-300 relative"
                      style={{
                        backgroundColor: color.toLowerCase(),
                      }}
                      variants={colorVariants}
                      animate={
                        selectedColor === color ? "selected" : "unselected"
                      }
                      whileHover="hover"
                      whileTap={{ scale: 0.9 }}
                      title={color}
                    >
                      {selectedColor === color && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Size Selection */}
            {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <p className="text-gray-700 mb-2 font-medium">
                  Size: {selectedSize && <span>{selectedSize}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct.sizes.map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className="px-4 py-2 rounded border border-gray-300 min-w-[3rem]"
                      variants={sizeVariants}
                      animate={
                        selectedSize === size ? "selected" : "unselected"
                      }
                      whileHover={selectedSize === size ? {} : "hover"}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Quantity */}
            {selectedProduct.countInStock > 0 && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <p className="text-gray-700 mb-2 font-medium">Quantity:</p>
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={() => handleQuantityChange("minus")}
                    className="px-3 py-1 border rounded bg-gray-100 text-lg font-medium disabled:opacity-50"
                    variants={quantityVariants}
                    whileHover="hover"
                    whileTap="tap"
                    disabled={quantity <= 1}
                  >
                    -
                  </motion.button>
                  <motion.span
                    className="text-lg font-medium min-w-[2rem] text-center"
                    key={quantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {quantity}
                  </motion.span>
                  <motion.button
                    onClick={() => handleQuantityChange("plus")}
                    className="px-3 py-1 border rounded bg-gray-100 text-lg font-medium disabled:opacity-50"
                    variants={quantityVariants}
                    whileHover="hover"
                    whileTap="tap"
                    disabled={quantity >= selectedProduct.countInStock}
                  >
                    +
                  </motion.button>
                </div>
              </motion.div>
            )}
            {/* Add to Cart Button */}
            <motion.button
              onClick={handleAddToCart}
              disabled={isButtonDisabled || selectedProduct.countInStock === 0}
              className="bg-black text-white py-3 px-6 rounded w-full mb-4 font-medium transition-colors hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              variants={buttonVariants}
              initial="initial"
              animate={
                isButtonDisabled || selectedProduct.countInStock === 0
                  ? "disabled"
                  : "visible"
              }
              whileHover={
                isButtonDisabled || selectedProduct.countInStock === 0
                  ? {}
                  : "hover"
              }
              whileTap={
                isButtonDisabled || selectedProduct.countInStock === 0
                  ? {}
                  : "tap"
              }
            >
              {selectedProduct.countInStock === 0 ? (
                "Out of Stock"
              ) : isButtonDisabled ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center"
                >
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Adding...
                </motion.span>
              ) : (
                "Add to Cart"
              )}
            </motion.button>
            {/* Product Details */}
            <motion.div
              className="mt-10 text-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h3 className="text-xl font-bold mb-4">Product Details</h3>
              <table className="w-full text-left text-sm text-gray-600">
                <tbody>
                  {selectedProduct.brand && (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.0 }}
                    >
                      <td className="py-2 font-medium">Brand</td>
                      <td className="py-2">{selectedProduct.brand}</td>
                    </motion.tr>
                  )}
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.05 }}
                  >
                    <td className="py-2 font-medium">Category</td>
                    <td className="py-2 capitalize">
                      {selectedProduct.category}
                    </td>
                  </motion.tr>
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.1 }}
                  >
                    <td className="py-2 font-medium">Collection</td>
                    <td className="py-2 capitalize">
                      {selectedProduct.collections}
                    </td>
                  </motion.tr>
                  {selectedProduct.material && (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.15 }}
                    >
                      <td className="py-2 font-medium">Material</td>
                      <td className="py-2">{selectedProduct.material}</td>
                    </motion.tr>
                  )}
                  {selectedProduct.gender && (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.2 }}
                    >
                      <td className="py-2 font-medium">Gender</td>
                      <td className="py-2">{selectedProduct.gender}</td>
                    </motion.tr>
                  )}
                  {selectedProduct.weight && (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.25 }}
                    >
                      <td className="py-2 font-medium">Weight</td>
                      <td className="py-2">{selectedProduct.weight} kg</td>
                    </motion.tr>
                  )}
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.3 }}
                    >
                      <td className="py-2 font-medium">Tags</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {selectedProduct.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 px-2 py-1 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <motion.div
            className="mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <motion.h2
              className="text-2xl font-medium text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              You May Also Like
            </motion.h2>
            <ProductGrid
              products={similarProducts}
              loading={loading}
              error={error}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductDetails;
