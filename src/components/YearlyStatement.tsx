import React, { useState, useMemo } from 'react';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { formatRupees } from '../utils/formatters';
import { downloadAsJpg } from '../utils/exportToJpg';
import { TemplateSelector } from './TemplateSelector';
import { useJpgTemplate } from '../hooks/useJpgTemplate';

interface YearlyStatementProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const YearlyStatement: React.FC<YearlyStatementProps> = ({
  invoices,
  customers = [],
  businessInfo,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [isExportingJpg, setIsExportingJpg] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useJpgTemplate();

  // Dynamically generate a broad year range (e.g., from 2020 to 2030) merged with any existing invoice years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const minYear = Math.min(2020, currentYear - 5);
    const maxYear = Math.max(2030, currentYear + 4);
    for (let y = minYear; y <= maxYear; y++) {
      years.add(y);
    }
    invoices.forEach((inv) => {
      if (inv.invoiceDate) {
        const y = new Date(inv.invoiceDate).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices, currentYear]);

  // Combine unique customer list from customers prop and invoice records
  const customerList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone?: string }>();
    customers.forEach((c) => {
      if (c.name) {
        map.set(c.name.trim().toLowerCase(), { id: c.id || c.name, name: c.name, phone: c.phone });
      }
    });
    invoices.forEach((inv) => {
      if (inv.customerName) {
        const key = inv.customerName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, { id: inv.customerId || inv.customerName, name: inv.customerName, phone: inv.customerPhone });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, invoices]);

  // Get selected customer details if a specific customer is picked
  const selectedCustomerObj = useMemo(() => {
    if (selectedCustomerId === 'all') return null;
    return customerList.find(
      (c) => c.id === selectedCustomerId || c.name.toLowerCase() === selectedCustomerId.toLowerCase()
    ) || null;
  }, [selectedCustomerId, customerList]);

  // Invoices filtered for selected year & selected customer
  const filteredYearInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (!inv.invoiceDate) return false;
      const y = new Date(inv.invoiceDate).getFullYear();
      if (y !== selectedYear) return false;

      if (selectedCustomerId === 'all') return true;

      if (selectedCustomerObj) {
        return (
          inv.customerId === selectedCustomerObj.id ||
          inv.customerName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase()
        );
      }
      return inv.customerName.trim().toLowerCase() === selectedCustomerId.trim().toLowerCase();
    });
  }, [invoices, selectedYear, selectedCustomerId, selectedCustomerObj]);

  // 1. Total Yearly Sales = Sum of all invoice sub-totals created in that selected year
  const totalYearlySales = useMemo(() => {
    return filteredYearInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  }, [filteredYearInvoices]);
  
  // 2. Total Yearly Payment Received = Sum of Payment Received for that selected year
  const totalYearlyCashReceived = useMemo(() => {
    return filteredYearInvoices.reduce((sum, inv) => sum + (Number(inv.paymentReceived) || 0), 0);
  }, [filteredYearInvoices]);

  // 3. Total Remaining Balance = Strictly (Total Period Sales - Total Period Payment Received)
  const totalYearlyRemaining = totalYearlySales - totalYearlyCashReceived;

  // 4. Total Invoices Count
  const totalInvoicesCount = filteredYearInvoices.length;

  // 12 Months breakdown showing Sales (Total Bill), Cash Received & Remaining Balance (Baqaya)
  const monthlyBreakdown = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: MONTH_NAMES[i],
      count: 0,
      sales: 0, // Sum of Items Subtotal / Total Bill
      cashReceived: 0, // Sum of Payment Received
      remainingBalance: 0, // Total Bill - Cash Received
    }));

    filteredYearInvoices.forEach((inv) => {
      if (!inv.invoiceDate) return;
      const m = new Date(inv.invoiceDate).getMonth();
      if (m >= 0 && m < 12) {
        const sub = Number(inv.subtotal) || 0;
        const paid = Number(inv.paymentReceived) || 0;

        months[m].count += 1;
        months[m].sales += sub;
        months[m].cashReceived += paid;
      }
    });

    months.forEach((m) => {
      m.remainingBalance = m.sales - m.cashReceived;
    });

    return months;
  }, [filteredYearInvoices]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJpg = async () => {
    try {
      setIsExportingJpg(true);
      const cleanCustomerSuffix = selectedCustomerObj ? `_${selectedCustomerObj.name.trim().replace(/\s+/g, '_')}` : '';
      await downloadAsJpg('yearly-report-area', `Yearly_Report_${selectedYear}${cleanCustomerSuffix}`);
    } catch (err) {
      console.error('Failed to export Yearly Report to JPG:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">
              Yearly Statement ({selectedYear})
            </h2>
            {selectedCustomerObj ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <i className="fa-solid fa-user text-[10px]"></i>
                <span>{selectedCustomerObj.name}</span>
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                All Customers
              </span>
            )}
            <span className="text-xs font-mono font-semibold text-slate-500">
              ({totalInvoicesCount} Invoices)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {selectedCustomerObj
              ? `Annual statement & month-by-month ledger for ${selectedCustomerObj.name} in year ${selectedYear}.`
              : `Total store sales, collections & remaining ledger balance for year ${selectedYear}.`}
          </p>
        </div>

        {/* Filter Dropdowns & Export/Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Selection Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i className="fa-solid fa-user-tag text-emerald-700 text-xs"></i>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer max-w-[160px] sm:max-w-[200px]"
              title="Filter by specific customer or all customers"
            >
              <option value="all">👥 All Customers (Store Total)</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i className="fa-solid fa-calendar text-slate-500 text-xs"></i>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-2 py-1 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Export JPG Button */}
          <button
            type="button"
            onClick={handleExportJpg}
            disabled={isExportingJpg}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-all shadow-xs min-h-[38px] cursor-pointer"
            title="Export Yearly Report as high-resolution JPG image"
          >
            {isExportingJpg ? (
              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fa-solid fa-image text-xs"></i>
            )}
            <span>{isExportingJpg ? 'Exporting...' : 'Export JPG'}</span>
          </button>

          {/* Print Annual Statement Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-xs min-h-[38px] cursor-pointer"
            title="Print annual report"
          >
            <i className="fa-solid fa-print text-xs"></i>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="bg-white p-3 sm:px-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">Export Theme:</span>
          <span className="text-[11px] text-slate-500">Pick theme before exporting to JPG</span>
        </div>
        <TemplateSelector
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          variant="pills"
        />
      </div>

      {/* Target Render Area for Yearly Report JPG Export */}
      <div
        id="yearly-report-area"
        data-template={selectedTemplate}
        className={`export-card-area export-card-wrapper space-y-6 bg-white p-4 sm:p-6 rounded-2xl border ${
          selectedTemplate === 'classic' ? 'border-2 border-blue-900 font-sans' :
          selectedTemplate === 'elegant' ? 'border-2 border-emerald-900 font-sans' :
          selectedTemplate === 'compact' ? 'border-2 border-dashed border-slate-400 font-mono text-xs' :
          'border border-slate-200 font-sans'
        }`}
        style={{ backgroundColor: '#ffffff', minHeight: '300px', color: '#111827' }}
      >
        {/* Report Official Header Section */}
        {selectedTemplate === 'elegant' ? (
          <div
            className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 p-6 sm:p-7 rounded-t-xl mb-4"
            style={{ backgroundColor: '#064e3b', color: '#ffffff', borderBottom: '4px solid #059669' }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ backgroundColor: '#047857', color: '#ffffff' }}
                >
                  Annual Financial Statement
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#ffffff' }}>
                  {businessInfo?.name || 'Store Financial Statement'}
                </h1>
                {businessInfo?.tagline && (
                  <p className="text-xs font-medium italic mt-0.5" style={{ color: '#a7f3d0' }}>{businessInfo.tagline}</p>
                )}
                <div className="text-xs mt-2 space-y-0.5" style={{ color: '#d1fae5' }}>
                  {businessInfo?.address && <p>📍 {businessInfo.address}</p>}
                  {businessInfo?.phone && <p>📞 Phone: {businessInfo.phone}</p>}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div
                  className="inline-block font-bold text-xs px-3 py-1 rounded tracking-wider uppercase mb-1"
                  style={{ backgroundColor: '#047857', color: '#ffffff' }}
                >
                  Annual Performance
                </div>
                <p className="text-xs font-bold" style={{ color: '#ffffff' }}>
                  Fiscal Year: {selectedYear}
                </p>
                <p className="text-[11px]" style={{ color: '#a7f3d0' }}>
                  Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div
              className="mt-4 pt-3 grid grid-cols-2 gap-4 text-xs p-3 rounded-lg"
              style={{ backgroundColor: '#047857', borderTop: '1px solid #059669', color: '#ffffff' }}
            >
              <div>
                <span className="font-bold uppercase text-[10px] block" style={{ color: '#6ee7b7' }}>Filter Scope:</span>
                <p className="font-bold text-sm" style={{ color: '#ffffff' }}>
                  {selectedCustomerObj ? selectedCustomerObj.name : 'All Store Customers'}
                </p>
              </div>
              <div>
                <span className="font-bold uppercase text-[10px] block" style={{ color: '#6ee7b7' }}>Total Invoices:</span>
                <p className="font-mono font-bold text-sm" style={{ color: '#ffffff' }}>{totalInvoicesCount} Invoices</p>
              </div>
            </div>
          </div>
        ) : selectedTemplate === 'classic' ? (
          <div
            className="p-4 sm:p-5 rounded-xl"
            style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #1e3a8a' }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ color: '#172554' }}>
                  {businessInfo?.name || 'Store Financial Statement'}
                </h1>
                {businessInfo?.tagline && (
                  <p className="text-xs font-semibold italic" style={{ color: '#1d4ed8' }}>{businessInfo.tagline}</p>
                )}
                <div className="text-xs mt-1 space-y-0.5" style={{ color: '#334155' }}>
                  {businessInfo?.address && <p>{businessInfo.address}</p>}
                  {businessInfo?.phone && <p className="font-medium">Phone: {businessInfo.phone}</p>}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div
                  className="inline-block font-bold text-xs px-3 py-1 rounded tracking-wider uppercase mb-1"
                  style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                >
                  Annual Financial Report
                </div>
                <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                  Fiscal Year: {selectedYear}
                </p>
                <p className="text-[11px]" style={{ color: '#475569' }}>
                  Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div
              className="mt-4 pt-3 grid grid-cols-2 gap-4 text-xs p-3 rounded-lg"
              style={{ backgroundColor: '#eff6ff', borderTop: '1px solid #bfdbfe' }}
            >
              <div>
                <span className="font-bold uppercase text-[10px] block" style={{ color: '#1e3a8a' }}>Filter Scope:</span>
                <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                  {selectedCustomerObj ? selectedCustomerObj.name : 'All Store Customers'}
                </p>
              </div>
              <div>
                <span className="font-bold uppercase text-[10px] block" style={{ color: '#1e3a8a' }}>Total Invoices:</span>
                <p className="font-mono font-bold text-sm" style={{ color: '#0f172a' }}>{totalInvoicesCount} Invoices</p>
              </div>
            </div>
          </div>
        ) : selectedTemplate === 'compact' ? (
          <div
            className="p-3 text-center"
            style={{ backgroundColor: '#ffffff', borderBottom: '2px dashed #94a3b8' }}
          >
            <h1 className="text-lg font-black uppercase" style={{ color: '#0f172a' }}>
              {businessInfo?.name || 'Annual Statement'}
            </h1>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              Year: {selectedYear} · {selectedCustomerObj ? selectedCustomerObj.name : 'All Customers'}
            </p>
            <div
              className="mt-2 pt-2 flex justify-between text-xs"
              style={{ borderTop: '1px dashed #cbd5e1' }}
            >
              <span>TOTAL INVOICES: {totalInvoicesCount}</span>
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        ) : (
          /* Modern Minimal */
          <div
            className="p-4 sm:p-5 bg-white rounded-xl"
            style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
                  {businessInfo?.name || 'Store Financial Statement'}
                </h1>
                {businessInfo?.tagline && (
                  <p className="text-xs font-medium" style={{ color: '#64748b' }}>{businessInfo.tagline}</p>
                )}
                <div className="text-xs mt-1 space-y-0.5" style={{ color: '#475569' }}>
                  {businessInfo?.address && <p>{businessInfo.address}</p>}
                  {businessInfo?.phone && <p className="font-medium">Phone: {businessInfo.phone}</p>}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: '#334155' }}>
                  Annual Statement
                </div>
                <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                  Year {selectedYear}
                </p>
              </div>
            </div>

            <div
              className="mt-4 pt-3 grid grid-cols-2 gap-4 text-xs p-3 rounded-lg"
              style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}
            >
              <div>
                <span className="font-bold uppercase text-[10px] block" style={{ color: '#94a3b8' }}>Filter Scope:</span>
                <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                  {selectedCustomerObj ? selectedCustomerObj.name : 'All Store Customers'}
                </p>
              </div>
              <div>
                <span className="font-bold uppercase text-[10px] block" style={{ color: '#94a3b8' }}>Total Invoices:</span>
                <p className="font-mono font-bold text-sm" style={{ color: '#1e293b' }}>{totalInvoicesCount} Invoices</p>
              </div>
            </div>
          </div>
        )}

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Yearly Sales / Total Bill */}
          <div className={`p-3.5 sm:p-5 rounded-xl space-y-1 flex flex-col justify-between border ${
            selectedTemplate === 'classic' ? 'bg-blue-50/70 border-blue-300' :
            selectedTemplate === 'elegant' ? 'bg-emerald-50/70 border-emerald-300' :
            selectedTemplate === 'compact' ? 'bg-slate-50 border-dashed border-slate-400 p-2.5' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between gap-1">
              <span className="truncate">{selectedCustomerObj ? 'Client Sales' : 'Yearly Sales'}</span>
              <span className="text-[9px] sm:text-[10px] text-emerald-900 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                Total Bill
              </span>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-emerald-900 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalYearlySales)}>
              {formatRupees(totalYearlySales)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              {selectedCustomerObj ? `${selectedCustomerObj.name.slice(0, 14)}...` : `All bills in ${selectedYear}`}
            </div>
          </div>

          {/* 2. Total Payment Received */}
          <div className={`p-3.5 sm:p-5 rounded-xl space-y-1 flex flex-col justify-between border ${
            selectedTemplate === 'classic' ? 'bg-blue-50/70 border-blue-300' :
            selectedTemplate === 'elegant' ? 'bg-emerald-50/70 border-emerald-300' :
            selectedTemplate === 'compact' ? 'bg-slate-50 border-dashed border-slate-400 p-2.5' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between gap-1">
              <span className="truncate">Payment Received</span>
              <span className="text-[9px] sm:text-[10px] text-sky-900 font-bold bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300 shrink-0">
                Collected
              </span>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-sky-900 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalYearlyCashReceived)}>
              {formatRupees(totalYearlyCashReceived)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              Paid in year {selectedYear}
            </div>
          </div>

          {/* 3. Total Remaining Balance (Baqaya) */}
          <div className={`p-3.5 sm:p-5 rounded-xl space-y-1 flex flex-col justify-between border ${
            selectedTemplate === 'compact' ? 'bg-slate-50 border-dashed border-slate-400 p-2.5' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between gap-1">
              <span className="truncate">Remaining</span>
              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                totalYearlyRemaining > 0
                  ? 'text-amber-950 bg-amber-100 border-amber-300'
                  : 'text-emerald-950 bg-emerald-100 border-emerald-300'
              }`}>
                Baqaya
              </span>
            </div>
            <div className={`text-base sm:text-lg lg:text-2xl font-black font-mono tabular-nums truncate tracking-tight py-0.5 ${
              totalYearlyRemaining > 0 ? 'text-amber-900' : 'text-emerald-900'
            }`} title={formatRupees(totalYearlyRemaining)}>
              {formatRupees(totalYearlyRemaining)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              Sales minus Payments
            </div>
          </div>

          {/* 4. Total Invoices Count */}
          <div className={`p-3.5 sm:p-5 rounded-xl space-y-1 flex flex-col justify-between border ${
            selectedTemplate === 'compact' ? 'bg-slate-50 border-dashed border-slate-400 p-2.5' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between gap-1">
              <span className="truncate">Invoices</span>
              <span className="text-[9px] sm:text-[10px] text-slate-800 font-bold bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300 shrink-0">
                Year {selectedYear}
              </span>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-slate-900 tabular-nums py-0.5">
              {totalInvoicesCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              {selectedCustomerObj ? 'Invoices for client' : `Invoices created in ${selectedYear}`}
            </div>
          </div>
        </div>

        {/* 12-Month Summary Table */}
        <div className={`bg-white p-4 sm:p-5 rounded-xl space-y-3 ${
          selectedTemplate === 'compact' ? 'border border-dashed border-slate-400' : 'border border-slate-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {selectedCustomerObj ? `${selectedCustomerObj.name} — Annual Statement` : `${selectedYear} Month-by-Month Statement`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedCustomerObj && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('all')}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Clear Customer Filter
                </button>
              )}
              <span className="text-[11px] font-mono font-bold text-slate-700">12 Months Summary</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`uppercase tracking-wider font-bold ${
                  selectedTemplate === 'elegant' ? 'bg-emerald-900 text-white text-[11px]' :
                  selectedTemplate === 'classic' ? 'bg-blue-900 text-white text-[11px]' :
                  selectedTemplate === 'compact' ? 'border-b border-dashed border-slate-600 text-slate-900 text-[10px]' :
                  'border-b-2 border-slate-300 bg-slate-100 text-[11px] text-slate-900'
                }`}>
                  <th className="py-2.5 px-3 sm:px-4 font-bold">Month</th>
                  <th className="py-2.5 px-3 sm:px-4 font-bold text-center w-20">Invoices</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">
                    Total Sales / Total Bill
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">
                    Total Payment Received
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">
                    Remaining Balance (Baqaya)
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${selectedTemplate === 'compact' ? 'divide-dashed divide-slate-300 font-mono' : 'divide-slate-200'}`}>
                {monthlyBreakdown.map((m) => {
                  const isZero = m.count === 0 && m.sales === 0 && m.cashReceived === 0;

                  return (
                    <tr
                      key={m.index}
                      className={`transition-colors ${
                        isZero ? 'hover:bg-slate-50/40 text-slate-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 ${
                          isZero ? 'font-normal text-slate-500' : 'font-bold text-slate-900'
                        }`}
                      >
                        {m.name}
                      </td>

                      <td
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 text-center font-mono tabular-nums ${
                          isZero ? 'text-slate-400' : 'text-slate-900 font-bold'
                        }`}
                      >
                        {isZero ? '0' : m.count}
                      </td>

                      <td
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-xs sm:text-sm ${
                          isZero
                            ? 'text-slate-400 font-normal'
                            : 'font-bold text-emerald-900 bg-emerald-50/40'
                        }`}
                      >
                        {formatRupees(m.sales)}
                      </td>

                      <td
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-xs sm:text-sm ${
                          isZero
                            ? 'text-slate-400 font-normal'
                            : 'font-bold text-sky-900 bg-sky-50/40'
                        }`}
                      >
                        {formatRupees(m.cashReceived)}
                      </td>

                      <td
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-xs sm:text-sm ${
                          isZero
                            ? 'text-slate-400 font-normal'
                            : m.remainingBalance > 0
                            ? 'font-bold text-amber-900 bg-amber-50/40'
                            : 'font-bold text-emerald-800 bg-emerald-50/30'
                        }`}
                      >
                        {formatRupees(m.remainingBalance)}
                      </td>
                    </tr>
                  );
                })}

                {/* Annual Totals Footer Row */}
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold">
                  <td className="py-3 px-3 sm:px-4 text-slate-950 text-xs sm:text-sm uppercase">
                    Total {selectedCustomerObj ? selectedCustomerObj.name : selectedYear}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-center font-mono tabular-nums text-slate-950 text-xs sm:text-sm">
                    {totalInvoicesCount}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-emerald-950 text-xs sm:text-base bg-emerald-200/60 font-black">
                    {formatRupees(totalYearlySales)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-sky-950 text-xs sm:text-base bg-sky-200/60 font-black">
                    {formatRupees(totalYearlyCashReceived)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-amber-950 text-xs sm:text-base bg-amber-200/60 font-black">
                    {formatRupees(totalYearlyRemaining)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Statement Signatures Block */}
        <div className="flex justify-between items-end pt-6 text-xs text-slate-700">
          <div className="text-center w-48">
            <div className="border-b-2 border-slate-400 pb-1 font-mono font-bold text-slate-900">
              Accountant / Manager
            </div>
            <p className="mt-1 text-[10px] text-slate-600 font-bold uppercase">Prepared By</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b-2 border-slate-400 pb-1 font-mono font-bold text-slate-900">
              {businessInfo?.name || 'Authorized Sign'}
            </div>
            <p className="mt-1 text-[10px] text-slate-600 font-bold uppercase">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

