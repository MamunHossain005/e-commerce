import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: User | null;
}

interface RootState {
  auth: AuthState;
}

interface ProtectedRouteProps {
  children: ReactNode;
  role?: string;
}

const ProtectedRoute = ({ children, role } : ProtectedRouteProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || (role && user.role !== role)) {
    return <Navigate to={"/login"} replace />;
  }
  return children;
};

export default ProtectedRoute;
