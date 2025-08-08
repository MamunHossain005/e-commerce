import React from "react";
import { IoMdClose } from "react-icons/io";
import CartContents from "../Cart/CartContents";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

interface CartDrawerProps {
  drawerOpen: boolean;
  toggleCartDrawer: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  drawerOpen,
  toggleCartDrawer,
}) => {
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state: RootState) => state.auth);
  const { cart, loading, error } = useSelector(
    (state: RootState) => state.cart
  );

  const handleCheckout = () => {
    toggleCartDrawer();
    if (!user) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Cart Products...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading cart products: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 w-3/4 md:w-1/2 lg:[10rem] h-full bg-white shadow-lg transition-transform transform duration-300 flex flex-col z-50"
      style={{ transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      {/* close button */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleCartDrawer}
          className="text-gray-700 hover:text-black"
        >
          <IoMdClose />
        </button>
      </div>
      {/* Cart contents with scrollable area */}
      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
        {cart && cart?.products?.length > 0 ? (
          <CartContents cart={cart} userId={user?._id} guestId={guestId} />
        ) : (
          <p>Your Cart is Empty</p>
        )}
      </div>
      {/* Checkout button */}
      <div className="p-4 bg-white sticky bottom-0">
        {cart && cart?.products?.length > 0 && (
          <>
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </button>
            <p className="text-sm tracking-tighter text-gray-500 mt-2 text-center">
              Shipping, taxes, and discount codes calculated at Checkout
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
