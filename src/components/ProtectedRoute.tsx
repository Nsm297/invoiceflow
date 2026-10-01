import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Login } from '../pages/Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that enforces authentication:
 * Block route redirects and login component until onIdTokenChanged auth check completes (authLoading === false).
 * Renders a clean splash/loading screen ("Restoring session...") while authLoading is true.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, loading, authLoading } = useAuth();
  const isLoading = authLoading ?? loading;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white selection:bg-emerald-500 selection:text-white">
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center text-2xl shadow-xl shadow-emerald-950 mb-4 border border-emerald-300/30">
          <i className="fa-solid fa-file-invoice"></i>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </div>
        <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <h2 className="text-lg font-black tracking-tight text-white">InvoiceFlow</h2>
        <p className="text-xs text-emerald-400/90 font-medium tracking-wide mt-1">
          Restoring session...
        </p>
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <Login />;
  }

  return <>{children}</>;
};
