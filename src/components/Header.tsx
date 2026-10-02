import React from 'react';
import { AuthUser } from '../context/AuthContext';
import { TabType } from '../types/invoice';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNewInvoice: () => void;
  invoicesCount: number;
  customersCount: number;
  pinEnabled?: boolean;
  onLockApp?: () => void;
  user: AuthUser | null;
  authLoading?: boolean;
  isSyncing?: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onNewInvoice,
  pinEnabled,
  onLockApp,
  user,
  authLoading,
  isSyncing,
  onGoogleSignIn,
  onGoogleSignOut,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onTabChange('create')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-lg py-1 px-1 -ml-1"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-emerald-800 transition-colors">
              <i className="fa-solid fa-receipt text-sm"></i>
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                InvoiceFlow
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 font-medium leading-none">
                Rupees (Rs.) Ledger & Billing
              </span>
            </div>
          </button>
        </div>

        {/* 6-Tab Navigation Bar (Desktop / Tablet) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => onTabChange('store')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              currentTab === 'store'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-store text-xs"></i>
            <span>Store Info & Security</span>
          </button>

          <button
            onClick={() => onTabChange('create')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              currentTab === 'create'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Create Invoice</span>
          </button>

          <button
            onClick={() => onTabChange('customers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              currentTab === 'customers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-users text-xs"></i>
            <span>Customers</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              currentTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left text-xs"></i>
            <span>History</span>
          </button>

          <button
            onClick={() => onTabChange('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              currentTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-calendar-days text-xs"></i>
            <span>Monthly</span>
          </button>

          <button
            onClick={() => onTabChange('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              currentTab === 'yearly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <i className="fa-solid fa-chart-line text-xs"></i>
            <span>Yearly</span>
          </button>
        </nav>

        {/* Right side: Google Auth Status + Primary Action Button + Quick Lock Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Install PWA Button */}
          <PWAInstallButton compact />

          {/* Google Auth Status / Button */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 px-2 py-1 rounded-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-emerald-500 shadow-xs"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden sm:flex flex-col text-left leading-tight max-w-[120px] md:max-w-[150px]">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded"
                    title="Connected to Firestore Cloud Sync"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="hidden md:inline">Connected</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
              </div>

              {isSyncing ? (
                <span className="text-emerald-700 text-xs px-1" title="Syncing to Cloud...">
                  <i className="fa-solid fa-cloud-arrow-up animate-bounce"></i>
                </span>
              ) : null}

              <button
                type="button"
                onClick={onGoogleSignOut}
                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors text-xs"
                title="Sign out of Google"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          ) : authLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg min-h-[36px]">
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline font-medium">Restoring session...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-all active:scale-[0.98] min-h-[36px]"
              title="Sign in with Google to enable Firestore Cloud Sync"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}

          {pinEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-lg transition-all min-h-[36px] whitespace-nowrap"
              title="Lock app screen now"
            >
              <i className="fa-solid fa-lock text-xs text-rose-600"></i>
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}

          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg transition-all shadow-sm min-h-[36px] whitespace-nowrap"
          >
            <i className="fa-solid fa-file-circle-plus text-xs"></i>
            <span>New Invoice</span>
          </button>
        </div>
      </div>
    </header>
  );
};

