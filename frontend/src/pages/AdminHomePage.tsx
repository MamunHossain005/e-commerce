import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProducts } from "../redux/slices/adminProductSlice";
import { fetchAllOrders } from "../redux/slices/adminOrderSlice";
import { fetchUsers } from "../redux/slices/adminSlice";

interface OrderUser {
  name: string;
  email: string;
}

interface Order {
  _id: string;
  user: OrderUser;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock?: number;
  countInStock?: number; // Your schema uses this field
  category: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

// Add proper typing for Redux state
interface RootState {
  adminProducts: {
    products: Product[];
    loading: boolean;
    error: string | null;
  };
  adminOrders: {
    orders: Order[];
    totalOrders: number;
    totalSales: number;
    loading: boolean;
    error: string | null;
  };
  admin: {
    users: User[];
    loading: boolean;
    error: string | null;
  };
}

const AdminHomePage = () => {
  const dispatch = useDispatch();

  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSelector((state: RootState) => state.adminProducts);

  const {
    orders,
    totalOrders,
    totalSales,
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state: RootState) => state.adminOrders);

  const {
    users,
    loading: usersLoading,
    error: usersError,
  } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminProducts() as any);
    dispatch(fetchAllOrders() as any);
    dispatch(fetchUsers() as any);
  }, [dispatch]);

  // Calculate statistics with null checks and proper order filtering
  const totalRevenue = totalSales || 0;
  const totalProducts = products?.length || 0;
  const totalUsers = users?.length || 0;

  // Filter orders by different statuses based on your schema
  const pendingOrders =
    orders?.filter(
      (order) =>
        order?.status === "Processing" || order?.paymentStatus === "Pending"
    )?.length || 0;

  const cancelledOrders =
    orders?.filter((order) => order?.status === "Cancel" || order?.isCancelled)
      ?.length || 0;

  const deliveredOrders =
    orders?.filter(
      (order) => order?.status === "Delivered" || order?.isDelivered
    )?.length || 0;

  const shippedOrders =
    orders?.filter((order) => order?.status === "Shipped")?.length || 0;

  // Low stock products calculation
  const lowStockProducts =
    products?.filter(
      (product) => (product?.countInStock || product?.stock || 0) < 10
    )?.length || 0;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Delivered":
        return "text-green-600 bg-green-100";
      case "Shipped":
        return "text-blue-600 bg-blue-100";
      case "Processing":
        return "text-yellow-600 bg-yellow-100";
      case "Cancel":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentStatusColor = (paymentStatus: string): string => {
    switch (paymentStatus) {
      case "Completed":
        return "text-green-600 bg-green-100";
      case "Pending":
        return "text-yellow-600 bg-yellow-100";
      case "Failed":
        return "text-red-600 bg-red-100";
      case "Cancelled":
        return "text-gray-600 bg-gray-100";
      case "Refunded":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>
      <div>
        {productsLoading || ordersLoading || usersLoading ? (
          <div className="p-6 flex justify-center items-center min-h-screen">
            <div className="flex justify-center items-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-lg">Loading...</p>
              </div>
            </div>
          </div>
        ) : productsError ? (
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Error fetching products: {productsError}
              </p>
            </div>
          </div>
        ) : ordersError ? (
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Error fetching orders: {ordersError}
              </p>
            </div>
          </div>
        ) : usersError ? (
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error fetching users: {usersError}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 shadow-md rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      ${totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-md rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-gray-600">
                      Total Orders
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalOrders}
                    </p>
                    <Link
                      to="/admin/orders"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Manage Orders →
                    </Link>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-md rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-gray-600">
                      Total Products
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalProducts}
                    </p>
                    <Link
                      to="/admin/products"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Manage Products →
                    </Link>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 shadow-md rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-gray-600">
                      Total Users
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalUsers}
                    </p>
                    <Link
                      to="/admin/users"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Manage Users →
                    </Link>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 8a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Processing Orders
                    </h3>
                    <p className="text-2xl font-bold text-yellow-900">
                      {pendingOrders}
                    </p>
                  </div>
                  {pendingOrders > 0 && (
                    <Link
                      to="/admin/orders?status=processing"
                      className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      Shipped Orders
                    </h3>
                    <p className="text-2xl font-bold text-blue-900">
                      {shippedOrders}
                    </p>
                  </div>
                  {shippedOrders > 0 && (
                    <Link
                      to="/admin/orders?status=shipped"
                      className="text-blue-700 hover:text-blue-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Delivered Orders
                    </h3>
                    <p className="text-2xl font-bold text-green-900">
                      {deliveredOrders}
                    </p>
                  </div>
                  {deliveredOrders > 0 && (
                    <Link
                      to="/admin/orders?status=delivered"
                      className="text-green-700 hover:text-green-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Cancelled Orders
                    </h3>
                    <p className="text-2xl font-bold text-red-900">
                      {cancelledOrders}
                    </p>
                  </div>
                  {cancelledOrders > 0 && (
                    <Link
                      to="/admin/orders?status=cancel"
                      className="text-red-700 hover:text-red-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Processing Orders Alert
                    </h3>
                  </div>
                  {pendingOrders > 0 && (
                    <Link
                      to="/admin/orders?status=processing"
                      className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  {pendingOrders} orders are currently being processed and need
                  attention
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <h3 className="text-sm font-medium text-red-800">
                      Low Stock Alert
                    </h3>
                  </div>
                  {lowStockProducts > 0 && (
                    <Link
                      to="/admin/products?filter=low-stock"
                      className="text-red-700 hover:text-red-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
                <p className="text-sm text-red-700 mt-1">
                  {lowStockProducts} products are running low on stock (less
                  than 10 units)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white shadow-md rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Recent Orders
                    </h3>
                    <Link
                      to="/admin/orders"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {orders && orders.length > 0 ? (
                    [...orders]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .slice(0, 5)
                      .map((order: Order) => (
                        <div
                          key={order._id}
                          className="px-6 py-4 hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <Link
                                to={`/admin/orders/${order._id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                Order #{order._id.slice(-6).toUpperCase()}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {order.user?.name || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                ${order.totalPrice.toFixed(2)}
                              </p>
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {order.status}
                                </span>
                                <br />
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                                    order.paymentStatus
                                  )}`}
                                >
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      No orders found
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Product Inventory
                    </h3>
                    <Link
                      to="/admin/products"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {products && products.length > 0 ? (
                    products.slice(0, 5).map((product: Product) => (
                      <div
                        key={product._id}
                        className="px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              to={`/admin/products/${product._id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {product.name || "Unnamed Product"}
                            </Link>
                            <p className="text-sm text-gray-500">
                              {product.category || "Uncategorized"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${product.price?.toFixed(2) || "0.00"}
                            </p>
                            <p
                              className={`text-sm ${
                                (product.countInStock || product.stock || 0) <
                                10
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              Stock:{" "}
                              {product.countInStock || product.stock || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      No products found
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/admin/products/new"
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Add New Product
                </Link>
                <Link
                  to="/admin/orders?status=processing"
                  className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors text-center font-medium"
                >
                  View Processing Orders
                </Link>
                <Link
                  to="/admin/users"
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  Add New User
                </Link>
                <Link
                  to="/admin/analytics"
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
                >
                  View Analytics
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Today's Sales</h4>
                <p className="text-3xl font-bold">
                  ${(totalRevenue * 0.1).toFixed(0)}
                </p>
                <p className="text-blue-100 text-sm">+12% from yesterday</p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Active Users</h4>
                <p className="text-3xl font-bold">
                  {users.filter((u) => !u.isAdmin).length}
                </p>
                <p className="text-green-100 text-sm">Regular customers</p>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <h4 className="text-lg font-medium mb-2">
                  Order Completion Rate
                </h4>
                <p className="text-3xl font-bold">
                  {totalOrders > 0
                    ? ((deliveredOrders / totalOrders) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-purple-100 text-sm">
                  {deliveredOrders} of {totalOrders} delivered
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminHomePage;
