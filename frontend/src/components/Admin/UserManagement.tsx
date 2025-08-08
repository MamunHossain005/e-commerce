import React, { useState } from "react";
import {
  User,
  Mail,
  Shield,
  Edit3,
  Trash2,
  Plus,
  UserCheck,
  Crown,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Menu,
  X,
  Calendar,
} from "lucide-react";

interface User {
  _id?: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin";
}

const UserManagement = () => {
  // Mock data for demonstration
  const [users, setUsers] = useState<User[]>([
    {
      _id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      _id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "customer",
      createdAt: "2024-02-10T14:20:00Z",
    },
    {
      _id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "customer",
      createdAt: "2024-03-05T09:15:00Z",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showSuccessNotification = (message: string) => {
    setNotification({ type: "success", message });
    setTimeout(() => setNotification(null), 3000);
  };

  const showErrorNotification = (message: string) => {
    setNotification({ type: "error", message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.preventDefault();

    const { name, email, password, role } = formData;

    // Basic validation
    if (!name.trim() || !email.trim()) {
      showErrorNotification("Name and email are required");
      return;
    }

    if (!editingUserId && !password.trim()) {
      showErrorNotification("Password is required for new users");
      return;
    }

    setLoading(true);

    try {
      if (editingUserId) {
        // Update existing user
        setUsers((prev) =>
          prev.map((user) =>
            user._id === editingUserId
              ? {
                  ...user,
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  updatedAt: new Date().toISOString(),
                }
              : user
          )
        );
        showSuccessNotification("User updated successfully");
        setEditingUserId(null);
      } else {
        // Add new user
        const newUser: User = {
          _id: Date.now().toString(),
          name: name.trim(),
          email: email.trim(),
          role,
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, newUser]);
        showSuccessNotification("User added successfully");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "customer",
      });

      // Close mobile menu after action
      setIsMobileMenuOpen(false);
    } catch (error: any) {
      showErrorNotification("Operation failed");
      console.error("Operation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true);
      try {
        setUsers((prev) => prev.filter((user) => user._id !== userId));
        showSuccessNotification("User deleted successfully");

        // If we were editing this user, cancel the edit
        if (editingUserId === userId) {
          handleCancelEdit();
        }
      } catch (error: any) {
        showErrorNotification("Delete failed");
        console.error("Delete failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setEditingUserId(user._id || null);
    // On mobile, open the form section
    setIsMobileMenuOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "customer",
    });
    setIsMobileMenuOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />;
      case "moderator":
        return <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />;
      default:
        return <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses =
      "px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1";
    switch (role) {
      case "admin":
        return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-200`;
      case "moderator":
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      default:
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 max-w-sm mx-auto sm:mx-0 ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
            <span className="font-medium text-xs sm:text-sm">
              {notification.message}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
            <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base px-4">
            Manage your team with style and efficiency
          </p>
        </div>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 sm:p-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {isMobileMenuOpen
              ? "Close Form"
              : editingUserId
              ? "Edit User"
              : "Add New User"}
          </button>
        </div>

        <div className="2xl:grid 2xl:grid-cols-3 gap-4 lg:space-y-16 2lg:gap-8">
          {/* Users Table Section */}
          <div
            className={`lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 ${
              isMobileMenuOpen ? "hidden lg:block" : "block"
            }`}
          >
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="truncate">Team Members</span>
                    {loading && (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                    )}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {users.length} active users
                  </p>
                </div>
              </div>

              {/* Desktop Table with Horizontal Scroll */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 px-3 sm:px-4 lg:px-6 xl:px-8 pb-2">
                  <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full ">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider min-w-[200px]">
                            User
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider min-w-[200px]">
                            Email
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider min-w-[120px]">
                            Role
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider min-w-[120px]">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            Joined
                          </th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider min-w-[120px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading && users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 sm:py-12"
                            >
                              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                              <p className="text-gray-500 text-sm sm:text-base">
                                Loading users...
                              </p>
                            </td>
                          </tr>
                        ) : users.length > 0 ? (
                          users.map((user) => (
                            <tr
                              key={user._id}
                              className={`hover:bg-gray-50/50 transition-colors duration-200 ${
                                editingUserId === user._id
                                  ? "bg-indigo-50/50 border-l-4 border-indigo-500"
                                  : ""
                              }`}
                            >
                              <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 text-xs sm:text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">
                                      {user.name}
                                    </h4>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                                    {user.email}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4">
                                <span className={getRoleBadge(user.role)}>
                                  {getRoleIcon(user.role)}
                                  <span className="hidden sm:inline">
                                    {user.role}
                                  </span>
                                </span>
                              </td>
                              <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4">
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {formatDate(user.createdAt)}
                                </span>
                              </td>
                              <td className="py-2 sm:py-3 lg:py-4 px-2 sm:px-4">
                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                  <button
                                    onClick={() => handleEdit(user)}
                                    disabled={loading}
                                    className="p-1.5 sm:p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit user"
                                  >
                                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user._id!)}
                                    disabled={loading}
                                    className="p-1.5 sm:p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 sm:py-12"
                            >
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-sm sm:text-lg font-medium">
                                No users found
                              </p>
                              <p className="text-gray-400 text-xs sm:text-sm px-4">
                                Add your first team member to get started
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-2 max-h-[60vh] overflow-y-auto">
                {loading && users.length === 0 ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-indigo-600" />
                    <p className="text-gray-500 text-xs">Loading users...</p>
                  </div>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <div
                      key={user._id}
                      className={`bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 hover:shadow-lg transition-all duration-200 ${
                        editingUserId === user._id
                          ? "ring-2 ring-indigo-500 bg-indigo-50/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs truncate">
                              {user.name}
                            </h4>
                            <div className="flex items-center gap-1 text-gray-600 text-xs mt-0.5">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={getRoleBadge(user.role)}>
                                {getRoleIcon(user.role)}
                                {user.role}
                              </span>
                              {user.createdAt && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(user.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(user)}
                            disabled={loading}
                            className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit user"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id!)}
                            disabled={loading}
                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">
                      No users found
                    </p>
                    <p className="text-gray-400 text-xs px-4">
                      Add your first team member to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div
            className={`bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 ${
              isMobileMenuOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                {editingUserId ? (
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                {editingUserId ? "Edit User" : "Add New User"}
              </h3>
            </div>

            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full p-2.5 sm:p-3 lg:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="Enter full name"
                />
              </div>

              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading || editingUserId !== null}
                  className="w-full p-2.5 sm:p-3 lg:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="Enter email address"
                />
                {editingUserId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed when editing
                  </p>
                )}
              </div>

              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingUserId}
                  disabled={loading}
                  placeholder={
                    editingUserId
                      ? "Leave blank to keep existing password"
                      : "Enter password"
                  }
                  className="w-full p-2.5 sm:p-3 lg:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                />
              </div>

              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full p-2.5 sm:p-3 lg:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUserId ? "Update User" : "Add User"}
                </button>

                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
