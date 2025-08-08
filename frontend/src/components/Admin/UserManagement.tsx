import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { User, Mail, Shield, Edit3, Trash2, Plus, UserCheck, Crown, Eye, AlertCircle, CheckCircle, Loader2, Menu, X } from "lucide-react";
import { fetchUsers, addUser, updateUser, deleteUser, clearError } from "../../redux/slices/adminSlice";
import { useNavigate } from "react-router-dom";

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

interface RootState {
  auth: {
    user: User | null;
  };
  admin: {
    users: User[];
    loading: boolean;
    error: string | null;
  };
}

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users, loading, error } = useSelector((state: RootState) => state.admin);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if(!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchUsers() as any);
    }
  }, [user, navigate, dispatch]);

  // Handle notifications
  useEffect(() => {
    if (error) {
      setNotification({ type: 'error', message: error });
      setTimeout(() => {
        dispatch(clearError());
        setNotification(null);
      }, 5000);
    }
  }, [error, dispatch]);

  const showSuccessNotification = (message: string) => {
    setNotification({ type: 'success', message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    
    const { name, email, password, role } = formData;

    // Basic validation
    if (!name.trim() || !email.trim()) {
      setNotification({ type: 'error', message: 'Name and email are required' });
      return;
    }

    if (!editingUserId && !password.trim()) {
      setNotification({ type: 'error', message: 'Password is required for new users' });
      return;
    }

    try {
      if (editingUserId) {
        // Update existing user
        await dispatch(updateUser({ 
          id: editingUserId, 
          name: name.trim(), 
          email: email.trim(), 
          role 
        }) as any).unwrap();
        showSuccessNotification('User updated successfully');
        setEditingUserId(null);
      } else {
        // Add new user
        const userData = {
          name: name.trim(),
          email: email.trim(),
          password,
          role
        };
        await dispatch(addUser(userData) as any).unwrap();
        showSuccessNotification('User added successfully');
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
      // Error handling is done through Redux state
      console.error('Operation failed:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(userId) as any).unwrap();
        showSuccessNotification('User deleted successfully');
        
        // If we were editing this user, cancel the edit
        if (editingUserId === userId) {
          handleCancelEdit();
        }
      } catch (error: any) {
        // Error handling is done through Redux state
        console.error('Delete failed:', error);
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
      case 'admin':
        return <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />;
      case 'moderator':
        return <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />;
      default:
        return <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold uppercase tracking-wider";
    switch (role) {
      case 'admin':
        return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-200`;
      case 'moderator':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      default:
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 max-w-sm mx-auto sm:mx-0 ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
            <span className="font-medium text-sm sm:text-base">{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl mb-4 shadow-lg">
            <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-4">Manage your team with style and efficiency</p>
        </div>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isMobileMenuOpen ? 'Close Form' : editingUserId ? 'Edit User' : 'Add New User'}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Form Section */}
          <div className={`bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 ${
            isMobileMenuOpen ? 'block' : 'hidden lg:block'
          }`}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                {editingUserId ? (
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                {editingUserId ? "Edit User" : "Add New User"}
              </h3>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                  className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="Enter full name"
                />
              </div>

              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                  className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="Enter email address"
                />
                {editingUserId && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed when editing</p>
                )}
              </div>

              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                  className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                />
              </div>

              <div className="group">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 group-hover:border-gray-300 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUserId ? "Update User" : "Add User"}
                </button>

                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="px-4 py-3 sm:px-6 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Users List Section */}
          <div className={`bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 ${
            isMobileMenuOpen ? 'hidden lg:block' : 'block'
          }`}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="truncate">Team Members</span>
                  {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">{users.length} active users</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {loading && users.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="text-gray-500 text-sm sm:text-base">Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user._id}
                    className={`bg-white/80 backdrop-blur-sm p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border border-white/30 hover:shadow-lg transition-all duration-200 group ${
                      editingUserId === user._id ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg shadow-lg flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors text-sm sm:text-base truncate">
                            {user.name}
                          </h4>
                          <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm">
                            <Mail className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.createdAt && (
                            <p className="text-xs text-gray-500 hidden sm:block">
                              Joined {formatDate(user.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {getRoleIcon(user.role)}
                          <span className={getRoleBadge(user.role)}>
                            {user.role}
                          </span>
                        </div>
                        
                        <div className="flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
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
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-base sm:text-lg font-medium">No users found</p>
                  <p className="text-gray-400 text-xs sm:text-sm px-4">Add your first team member to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;