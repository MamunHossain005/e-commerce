import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../../redux/slices/adminOrderSlice";
import { useNavigate } from "react-router-dom";

interface OrderUser {
  _id: string;
  name: string;
  email?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface Order {
  _id: string;
  user: OrderUser;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  paymentStatus: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancel";
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface RootState {
  adminOrders: {
    orders: Order[];
    totalOrders: number;
    totalSales: number;
    loading: boolean;
    error: string | null;
  };
  auth: AuthState;
}

const OrderManagement = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const { orders, loading, error } = useSelector(
    (state: RootState) => state.adminOrders
  );
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders() as any);
    }
  }, [user, navigate, dispatch]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status }) as any);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await dispatch(deleteOrder(orderId) as any);
      } catch (error) {
        console.error("Failed to delete order:", error);
      }
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Cancel":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (
    isPaid: boolean,
    paymentStatus: string
  ): string => {
    if (isPaid) return "bg-green-100 text-green-800";
    if (paymentStatus === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and sort orders
  const filteredOrders =
    orders?.filter((order) => {
      if (statusFilter === "all") return true;
      return order.status.toLowerCase() === statusFilter.toLowerCase();
    }) || [];

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "totalPrice":
        aValue = a.totalPrice;
        bValue = b.totalPrice;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "customer":
        aValue = a.user?.name || "";
        bValue = b.user?.name || "";
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        aValue = a._id;
        bValue = b._id;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Product Orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error loading orders: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Order Management
        </h2>

        {/* Filters and Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="statusFilter"
                className="text-sm font-medium text-gray-700"
              >
                Filter by Status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="all">All Orders</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancel">Cancelled</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="sortBy"
                className="text-sm font-medium text-gray-700"
              >
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="createdAt">Order Date</option>
                <option value="customer">Customer</option>
                <option value="totalPrice">Total Price</option>
                <option value="status">Status</option>
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
            Showing {sortedOrders.length} of {orders?.length || 0} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Total Price</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Order Date</th>
              <th className="py-3 px-4">Update Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <>
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedOrders.has(order._id) ? "▼" : "▶"}
                        </button>
                        #{order._id.slice(-6)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">
                          {order.user?.name || "Unknown Customer"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {order.orderItems?.length || 0} item(s)
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      ${order.totalPrice?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                            order.isPaid,
                            order.paymentStatus
                          )}`}
                        >
                          {order.isPaid ? "Paid" : order.paymentStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[120px]"
                        disabled={loading}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancel">Cancel</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {order.status !== "Delivered" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order._id, "Delivered")
                            }
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                            disabled={loading}
                          >
                            Mark Delivered
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Order Details */}
                  {expandedOrders.has(order._id) && (
                    <tr>
                      <td colSpan={9} className="p-4 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Order Items
                            </h4>
                            <div className="space-y-2">
                              {order.orderItems?.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 bg-white p-3 rounded-lg"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {item.size && `Size: ${item.size} `}
                                      {item.color && `Color: ${item.color}`}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Qty: {item.quantity} × $
                                      {item.price?.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="font-semibold text-sm">
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Shipping Address
                            </h4>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="text-sm text-gray-700">
                                <div>{order.shippingAddress?.address}</div>
                                <div>
                                  {order.shippingAddress?.city},{" "}
                                  {order.shippingAddress?.postalCode}
                                </div>
                                <div>{order.shippingAddress?.country}</div>
                              </div>
                            </div>

                            {/* Order Timeline */}
                            <h4 className="font-semibold text-gray-900 mb-3 mt-4">
                              Order Timeline
                            </h4>
                            <div className="bg-white p-3 rounded-lg space-y-2">
                              <div className="text-sm">
                                <span className="text-gray-500">Created:</span>{" "}
                                {formatDate(order.createdAt)}
                              </div>
                              {order.paidAt && (
                                <div className="text-sm">
                                  <span className="text-gray-500">Paid:</span>{" "}
                                  {formatDate(order.paidAt)}
                                </div>
                              )}
                              {order.deliveredAt && (
                                <div className="text-sm">
                                  <span className="text-gray-500">
                                    Delivered:
                                  </span>{" "}
                                  {formatDate(order.deliveredAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
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
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-400 mb-1">
                      No orders found
                    </p>
                    <p className="text-sm text-gray-400">
                      {statusFilter !== "all"
                        ? `No orders with status "${statusFilter}"`
                        : "There are no orders to display"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {sortedOrders.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">
              {sortedOrders.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-gray-900">
              $
              {sortedOrders
                .reduce((sum, order) => sum + (order.totalPrice || 0), 0)
                .toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Processing</div>
            <div className="text-2xl font-bold text-yellow-600">
              {
                sortedOrders.filter((order) => order.status === "Processing")
                  .length
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Shipped</div>
            <div className="text-2xl font-bold text-blue-600">
              {
                sortedOrders.filter((order) => order.status === "Shipped")
                  .length
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Delivered</div>
            <div className="text-2xl font-bold text-green-600">
              {
                sortedOrders.filter((order) => order.status === "Delivered")
                  .length
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;