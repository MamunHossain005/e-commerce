import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProducts } from "../redux/slices/adminProductSlice";
import { fetchAllOrders } from "../redux/slices/adminOrderSlice";
import { fetchUsers } from "../redux/slices/adminSlice";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

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
  countInStock?: number;
  category: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string;
}

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

const AdminAnalyticsPage = () => {
  const dispatch = useDispatch();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

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

  // Helper function to get date range
  const getDateRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  // Filter orders by time range
  const getFilteredOrders = () => {
    if (!orders) return [];
    const { start } = getDateRange(timeRange);
    return orders.filter(order => new Date(order.createdAt) >= start);
  };

  // Calculate analytics data
  const getAnalyticsData = () => {
    const filteredOrders = getFilteredOrders();
    
    // Revenue over time
    const revenueData = [];
    const { start, end } = getDateRange(timeRange);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = filteredOrders.filter(order => 
        order.createdAt.split('T')[0] === dateStr && order.isPaid
      );
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      
      revenueData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue,
        orders: dayOrders.length
      });
    }

    // Order status distribution
    const statusData = [
      { name: 'Processing', value: filteredOrders.filter(o => o.status === 'Processing').length, color: '#f59e0b' },
      { name: 'Shipped', value: filteredOrders.filter(o => o.status === 'Shipped').length, color: '#3b82f6' },
      { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'Delivered').length, color: '#10b981' },
      { name: 'Cancelled', value: filteredOrders.filter(o => o.status === 'Cancel' || o.isCancelled).length, color: '#ef4444' }
    ];

    // Product category performance
    const categoryPerformance = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { category, products: 0, totalValue: 0 };
      }
      acc[category].products += 1;
      acc[category].totalValue += product.price * (product.countInStock || 0);
      return acc;
    }, {} as Record<string, { category: string; products: number; totalValue: number }>);

    const categoryData = Object.values(categoryPerformance);

    // Payment status distribution
    const paymentData = [
      { name: 'Completed', value: filteredOrders.filter(o => o.paymentStatus === 'Completed').length, color: '#10b981' },
      { name: 'Pending', value: filteredOrders.filter(o => o.paymentStatus === 'Pending').length, color: '#f59e0b' },
      { name: 'Failed', value: filteredOrders.filter(o => o.paymentStatus === 'Failed').length, color: '#ef4444' },
      { name: 'Cancelled', value: filteredOrders.filter(o => o.paymentStatus === 'Cancelled').length, color: '#6b7280' },
      { name: 'Refunded', value: filteredOrders.filter(o => o.paymentStatus === 'Refunded').length, color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    // Monthly growth data
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd && order.isPaid;
      });
      
      const monthUsers = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= monthStart && userDate <= monthEnd && !user.isAdmin;
      });
      
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthOrders.reduce((sum, order) => sum + order.totalPrice, 0),
        orders: monthOrders.length,
        users: monthUsers.length
      });
    }

    return {
      revenueData,
      statusData,
      categoryData,
      paymentData,
      monthlyData
    };
  };

  const analytics = getAnalyticsData();
  const filteredOrders = getFilteredOrders();

  // Calculate key metrics
  const totalRevenue = filteredOrders.filter(o => o.isPaid).reduce((sum, order) => sum + order.totalPrice, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.filter(o => o.isPaid).length : 0;
  const conversionRate = users.length > 0 ? (filteredOrders.length / users.filter(u => !u.isAdmin).length) * 100 : 0;
  const totalCustomers = users.filter(u => !u.isAdmin).length;

  const loading = productsLoading || ordersLoading || usersLoading;
  const error = productsError || ordersError || usersError;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your store performance</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              <p className="text-blue-100 text-sm">Last {timeRange}</p>
            </div>
            <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{filteredOrders.length}</p>
              <p className="text-green-100 text-sm">Last {timeRange}</p>
            </div>
            <svg className="w-8 h-8 text-green-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Order Value</p>
              <p className="text-3xl font-bold">${averageOrderValue.toFixed(2)}</p>
              <p className="text-purple-100 text-sm">Per order</p>
            </div>
            <svg className="w-8 h-8 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.563-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Customers</p>
              <p className="text-3xl font-bold">{totalCustomers}</p>
              <p className="text-orange-100 text-sm">Active users</p>
            </div>
            <svg className="w-8 h-8 text-orange-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="products" fill="#10b981" name="Products" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Growth Trend */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth Trend</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analytics.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
            <Line yAxisId="right" type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} name="New Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</h4>
          <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Orders per customer</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Product Categories</h4>
          <p className="text-2xl font-bold text-gray-900">{analytics.categoryData.length}</p>
          <p className="text-sm text-gray-500">Active categories</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Low Stock Items</h4>
          <p className="text-2xl font-bold text-gray-900">
            {products.filter(p => (p.countInStock || 0) < 10).length}
          </p>
          <p className="text-sm text-gray-500">Items need restocking</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;