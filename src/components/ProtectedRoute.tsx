import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that enforces authentication:
 * DO NOT redirect to login while loading is true.
 * Renders a loading spinner instead until loading is false.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-xs my-6">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <h3 className="text-sm font-bold text-slate-800">Checking Authentication</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Restoring your secure local session from IndexedDB...
        </p>
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
