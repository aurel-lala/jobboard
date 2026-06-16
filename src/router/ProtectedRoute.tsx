import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForUser } from '@/lib/authRedirect';

interface ProtectedRouteProps {
  children: JSX.Element;
  role?: 'candidate' | 'employer' | 'admin';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return children;
}
