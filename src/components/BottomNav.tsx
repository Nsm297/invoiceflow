import React from 'react';
import { TabType } from '../types/invoice';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 pb-safe no-print">
      <div className="grid grid-cols-6 items-center h-14 max-w-lg mx-auto">
        
        {/* Tab 1: Store & Security */}
        <button
          onClick={() => onTabChange('store')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
            currentTab === 'store'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Store Info & Security"
        >
          <i className={`fa-solid fa-shield-halved text-base ${currentTab === 'store' ? 'text-emerald-700' : ''}`}></i>
          <span className="text-[9px] sm:text-[10px] leading-tight mt-1 whitespace-nowrap">Security</span>
        </button>

        {/* Tab 2: Create Invoice */}
        <button
          onClick={() => onTabChange('create')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
            currentTab === 'create'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Create Invoice"
        >
          <i className={`fa-solid fa-file-invoice text-base ${currentTab === 'create' ? 'text-emerald-700' : ''}`}></i>
          <span className="text-[9px] sm:text-[10px] leading-tight mt-1 whitespace-nowrap">Create</span>
        </button>

        {/* Tab 3: Customers */}
        <button
          onClick={() => onTabChange('customers')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
            currentTab === 'customers'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Customers"
        >
          <i className={`fa-solid fa-users text-base ${currentTab === 'customers' ? 'text-emerald-700' : ''}`}></i>
          <span className="text-[9px] sm:text-[10px] leading-tight mt-1 whitespace-nowrap">Clients</span>
        </button>

        {/* Tab 4: History */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
            currentTab === 'history'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="History"
        >
          <i className={`fa-solid fa-clock-rotate-left text-base ${currentTab === 'history' ? 'text-emerald-700' : ''}`}></i>
          <span className="text-[9px] sm:text-[10px] leading-tight mt-1 whitespace-nowrap">History</span>
        </button>

        {/* Tab 5: Monthly */}
        <button
          onClick={() => onTabChange('monthly')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
            currentTab === 'monthly'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Monthly Statement"
        >
          <i className={`fa-solid fa-calendar-days text-base ${currentTab === 'monthly' ? 'text-emerald-700' : ''}`}></i>
          <span className="text-[9px] sm:text-[10px] leading-tight mt-1 whitespace-nowrap">Monthly</span>
        </button>

        {/* Tab 6: Yearly */}
        <button
          onClick={() => onTabChange('yearly')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
            currentTab === 'yearly'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Yearly Statement"
        >
          <i className={`fa-solid fa-chart-line text-base ${currentTab === 'yearly' ? 'text-emerald-700' : ''}`}></i>
          <span className="text-[9px] sm:text-[10px] leading-tight mt-1 whitespace-nowrap">Yearly</span>
        </button>

      </div>
    </nav>
  );
};
