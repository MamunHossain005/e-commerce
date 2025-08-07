import React from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";

// Define interfaces for type safety
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

interface CartContentsProps {
  cart: Cart;
  userId?: string;
  guestId?: string;
}

const CartContents: React.FC<CartContentsProps> = ({ cart, userId, guestId }) => {
  const dispatch = useDispatch();

  // Handle adding or subtracting to cart
  const handleUpdateQuantity = (
    productId: string, 
    delta: number, 
    currentQuantity: number, 
    size?: string, 
    color?: string
  ) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity >= 1) {
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: newQuantity,
          guestId,
          userId,
          size,
          color,
        }) as any
      );
    }
  };

  const handleRemoveFromCart = (
    productId: string, 
    size?: string, 
    color?: string
  ) => {
    dispatch(
      removeFromCart({ 
        productId, 
        guestId, 
        userId, 
        size, 
        color 
      }) as any
    );
  };

  // Calculate individual item total
  const getItemTotal = (price: string | undefined, quantity: number) => {
    const itemPrice = parseFloat(price || "0");
    return (itemPrice * quantity).toFixed(2);
  };

  // Generate unique key for cart items (considering size and color variations)
  const getItemKey = (productId: string, size?: string, color?: string) => {
    return `${productId}-${size || 'no-size'}-${color || 'no-color'}`;
  };

  if (!cart || !cart.products) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No cart data available.</p>
      </div>
    );
  }

  return (
    <div>
      {cart.products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Your cart is empty.</p>
          <p className="text-sm text-gray-400 mt-2">
            Add some products to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.products.map((product) => (
            <div
              key={getItemKey(product.productId, product.size, product.color)}
              className="flex items-center space-x-4 border-b pb-4 last:border-b-0"
            >
              {/* Product Image */}
              <div className="flex-shrink-0">
                <img
                  src={product.image || "/placeholder-image.jpg"}
                  alt={product.name || "Product"}
                  className="w-20 h-24 rounded object-cover bg-gray-100"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image.jpg";
                  }}
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {product.name || "Unknown Product"}
                </h3>
                
                {/* Size and Color */}
                {(product.size || product.color) && (
                  <div className="text-sm text-gray-600 mt-1">
                    {product.size && (
                      <span className="inline-block mr-3">
                        Size: <span className="font-medium">{product.size}</span>
                      </span>
                    )}
                    {product.color && (
                      <span className="inline-block">
                        Color: <span className="font-medium">{product.color}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center mt-3">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(
                        product.productId,
                        -1,
                        product.quantity,
                        product.size,
                        product.color
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={product.quantity <= 1}
                  >
                    <span className="text-lg font-medium">−</span>
                  </button>
                  
                  <span className="mx-4 text-lg font-medium text-gray-900 min-w-[2rem] text-center">
                    {product.quantity}
                  </span>
                  
                  <button
                    onClick={() =>
                      handleUpdateQuantity(
                        product.productId,
                        1,
                        product.quantity,
                        product.size,
                        product.color
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <span className="text-lg font-medium">+</span>
                  </button>
                </div>
              </div>

              {/* Price and Remove Button */}
              <div className="flex flex-col items-end space-y-2">
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ${getItemTotal(product.price, product.quantity)}
                  </p>
                  {product.quantity > 1 && (
                    <p className="text-sm text-gray-500">
                      ${parseFloat(product.price || "0").toFixed(2)} each
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() =>
                    handleRemoveFromCart(
                      product.productId,
                      product.size,
                      product.color
                    )
                  }
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Remove item from cart"
                >
                  <RiDeleteBin3Line className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Cart Summary */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total ({cart.products.reduce((sum, item) => sum + item.quantity, 0)} items):
              </span>
              <span className="text-xl font-bold text-gray-900">
                ${cart.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartContents;