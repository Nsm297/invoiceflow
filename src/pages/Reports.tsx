import React, { useState } from 'react';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { MonthlyStatement } from '../components/MonthlyStatement';
import { YearlyStatement } from '../components/YearlyStatement';
import { downloadAsJpg } from '../utils/exportToJpg';

interface ReportsPageProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
  onPreviewInvoice?: (invoice: Invoice) => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
}

export const Reports: React.FC<ReportsPageProps> = ({
  invoices,
  customers = [],
  businessInfo,
  onPreviewInvoice = () => {},
  onShareWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="space-y-6">
      {/* Reports Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-500">
            Generate and export high-resolution JPG statements for Monthly and Annual performance
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-calendar-days mr-1.5 text-emerald-600"></i>
            Monthly Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeTab === 'yearly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-chart-column mr-1.5 text-indigo-600"></i>
            Yearly Report
          </button>
        </div>
      </div>

      {/* Active Report View */}
      {activeTab === 'monthly' ? (
        <MonthlyStatement
          invoices={invoices}
          customers={customers}
          businessInfo={businessInfo}
          onPreviewInvoice={onPreviewInvoice}
          onShareWhatsApp={onShareWhatsApp}
        />
      ) : (
        <YearlyStatement
          invoices={invoices}
          customers={customers}
          businessInfo={businessInfo}
        />
      )}
    </div>
  );
};

export { downloadAsJpg };
export default Reports;
