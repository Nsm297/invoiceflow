import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Login } from '../pages/Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, loading, authLoading } = useAuth();
  const isLoading = authLoading ?? loading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <Login />;
  }

  return <>{children}</>;
};
