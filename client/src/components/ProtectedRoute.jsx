/**
 * @file Protected Route Guard
 * @description Secures pages by validating user authentication state.
 *              Displays an ultra-minimal loading state while verifying.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-ivory flex flex-col items-center justify-center">
        <p className="font-serif text-lg tracking-[0.25em] text-luxury-espresso animate-pulse uppercase">
          AUTHENTICATING...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
