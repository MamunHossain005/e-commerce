import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import type { RootState } from "../redux/store";
import type { AppDispatch } from "../redux/store";
import type { Order } from "../types/order"; // This should now use your updated Order type

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector(
    (state: RootState) => state.orders
  );

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const handleRowClick = (orderId: string): void => {
    navigate(`/order/${orderId}`);
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const calculateCanBeCancelled = (order: Order): boolean => {
    if (order.isDelivered) return false;

    if (
      order.isCancelled ||
      order.status === "Cancel" ||
      order.paymentStatus === "Cancelled"
    )
      return false;

    if (!order.paymentDetails?.transactionId && order.isPaid) return false;

    const createdAt =
      typeof order.createdAt === "string"
        ? new Date(order.createdAt)
        : order.createdAt;
    const hoursDiff =
      (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Orders...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading orders: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">My Orders</h2>
      <div className="relative shadow-md sm:rounded-lg overflow-hidden">
        <table className="min-w-full text-left text-gray-500">
          <thead>
            <tr>
              <th className="py-2 px-4 sm:py-3">Image</th>
              <th className="py-2 px-4 sm:py-3">Order ID</th>
              <th className="py-2 px-4 sm:py-3">Created</th>
              <th className="py-2 px-4 sm:py-3">Shipping Address</th>
              <th className="py-2 px-4 sm:py-3">Items</th>
              <th className="py-2 px-4 sm:py-3">Price</th>
              <th className="py-2 px-4 sm:py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order: Order) => {
                const canBeCancelled =
                  order.canBeCancelled ?? calculateCanBeCancelled(order);

                return (
                  <tr
                    key={order._id}
                    onClick={() => handleRowClick(order._id)}
                    className="border-b hover:border-gray-50 cursor-pointer"
                  >
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      <img
                        src={order.orderItems[0].image}
                        alt={order.orderItems[0].name}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
                      />
                    </td>
                    <td className="py-2 px-2 sm:py-4 font-medium text-gray-900 whitespace-nowrap">
                      #{order._id}
                    </td>
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      {order.shippingAddress
                        ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
                        : "N/A"}
                    </td>
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      {order.orderItems.length}
                    </td>
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      <span
                        className={`${
                          order.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        } px-2 py-1 rounded-full text-xs sm:text-sm font-medium`}
                      >
                        {order.isPaid ? "Paid" : "Pending"}
                      </span>
                      {canBeCancelled && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                          Cancellable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
                  You have no orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyOrdersPage;
