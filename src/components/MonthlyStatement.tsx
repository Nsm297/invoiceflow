import React, { useState, useMemo } from 'react';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate } from '../utils/formatters';
import { downloadAsJpg } from '../utils/exportToJpg';
import { TemplateSelector } from './TemplateSelector';
import { useJpgTemplate } from '../hooks/useJpgTemplate';

interface MonthlyStatementProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
  onPreviewInvoice: (invoice: Invoice) => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthlyStatement: React.FC<MonthlyStatementProps> = ({
  invoices,
  customers = [],
  businessInfo,
  onPreviewInvoice,
  onShareWhatsApp,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [isExportingJpg, setIsExportingJpg] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useJpgTemplate();

  // Dynamically generate a broad year range (e.g., from 2020 to 2030) merged with any existing invoice years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currYear = currentDate.getFullYear();
    const minYear = Math.min(2020, currYear - 5);
    const maxYear = Math.max(2030, currYear + 4);
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
  }, [invoices, currentDate]);

  // Combine unique customer list from customers prop and invoice customer names
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

  // Filter invoices for selected month, year, and customer
  const filteredMonthInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (!inv.invoiceDate) return false;
      const d = new Date(inv.invoiceDate);
      const matchesDate = d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      if (!matchesDate) return false;

      if (selectedCustomerId === 'all') return true;

      if (selectedCustomerObj) {
        return (
          inv.customerId === selectedCustomerObj.id ||
          inv.customerName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase()
        );
      }
      return inv.customerName.trim().toLowerCase() === selectedCustomerId.trim().toLowerCase();
    });
  }, [invoices, selectedYear, selectedMonth, selectedCustomerId, selectedCustomerObj]);

  // 1. Total Monthly Sales = Sum of all invoice sub-totals in that selected period
  const totalMonthlySales = useMemo(() => {
    return filteredMonthInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  }, [filteredMonthInvoices]);
  
  // 2. Total Monthly Payment Received = Sum of payments received in that selected period
  const totalMonthlyCashReceived = useMemo(() => {
    return filteredMonthInvoices.reduce((sum, inv) => sum + (Number(inv.paymentReceived) || 0), 0);
  }, [filteredMonthInvoices]);

  // 3. Total Monthly Remaining Balance = Strictly (Total Period Sales - Total Period Payment Received)
  const totalMonthlyRemaining = totalMonthlySales - totalMonthlyCashReceived;

  // 4. Total Invoices Count
  const invoiceCount = filteredMonthInvoices.length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJpg = async () => {
    try {
      setIsExportingJpg(true);
      const monthName = MONTH_NAMES[selectedMonth];
      const cleanCustomerSuffix = selectedCustomerObj ? `_${selectedCustomerObj.name.trim().replace(/\s+/g, '_')}` : '';
      await downloadAsJpg('monthly-report-area', `Monthly_Report_${monthName}_${selectedYear}${cleanCustomerSuffix}`);
    } catch (err) {
      console.error('Failed to export Monthly Report to JPG:', err);
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
            <h2 className="text-base font-bold text-slate-900">Monthly Statement</h2>
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
              ({invoiceCount} {invoiceCount === 1 ? 'Invoice' : 'Invoices'})
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {selectedCustomerObj
              ? `Monthly statement & ledger breakdown for ${selectedCustomerObj.name} in ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`
              : `Overall store sales, collections & remaining ledger balance for ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`}
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

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 min-h-[38px]">
            <i className="fa-solid fa-calendar text-slate-500 text-xs"></i>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name.slice(0, 3)}
                </option>
              ))}
            </select>

            <span className="text-slate-400">/</span>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
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
            title="Export Monthly Report as high-resolution JPG image"
          >
            {isExportingJpg ? (
              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fa-solid fa-image text-xs"></i>
            )}
            <span>{isExportingJpg ? 'Exporting...' : 'Export JPG'}</span>
          </button>

          {/* Print Statement Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-xs min-h-[38px] cursor-pointer"
            title="Print statement"
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

      {/* Target Render Area for Monthly Report JPG Export */}
      <div
        id="monthly-report-area"
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
                  Monthly Financial Statement
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
                  Monthly Performance
                </div>
                <p className="text-xs font-bold" style={{ color: '#ffffff' }}>
                  Period: {MONTH_NAMES[selectedMonth]} {selectedYear}
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
                <p className="font-mono font-bold text-sm" style={{ color: '#ffffff' }}>{invoiceCount} Invoices</p>
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
                  Monthly Sales & Ledger Report
                </div>
                <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                  Period: {MONTH_NAMES[selectedMonth]} {selectedYear}
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
                <p className="font-mono font-bold text-sm" style={{ color: '#0f172a' }}>{invoiceCount} Invoices</p>
              </div>
            </div>
          </div>
        ) : selectedTemplate === 'compact' ? (
          <div
            className="p-3 text-center"
            style={{ backgroundColor: '#ffffff', borderBottom: '2px dashed #94a3b8' }}
          >
            <h1 className="text-lg font-black uppercase" style={{ color: '#0f172a' }}>
              {businessInfo?.name || 'Monthly Statement'}
            </h1>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              Period: {MONTH_NAMES[selectedMonth]} {selectedYear} · {selectedCustomerObj ? selectedCustomerObj.name : 'All Customers'}
            </p>
            <div
              className="mt-2 pt-2 flex justify-between text-xs"
              style={{ borderTop: '1px dashed #cbd5e1' }}
            >
              <span>INVOICES: {invoiceCount}</span>
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
                  Monthly Performance
                </div>
                <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                  Period: {MONTH_NAMES[selectedMonth]} {selectedYear}
                </p>
                <p className="text-[11px]" style={{ color: '#64748b' }}>
                  Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
                <p className="font-mono font-bold text-sm" style={{ color: '#1e293b' }}>{invoiceCount} Invoices</p>
              </div>
            </div>
          </div>
        )}

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Monthly Sales / Total Bill */}
          <div className={`p-3.5 sm:p-5 rounded-xl space-y-1 flex flex-col justify-between border ${
            selectedTemplate === 'classic' ? 'bg-blue-50/70 border-blue-300' :
            selectedTemplate === 'elegant' ? 'bg-emerald-50/70 border-emerald-300' :
            selectedTemplate === 'compact' ? 'bg-slate-50 border-dashed border-slate-400 p-2.5' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between gap-1">
              <span className="truncate">{selectedCustomerObj ? 'Client Sales' : 'Monthly Sales'}</span>
              <span className="text-[9px] sm:text-[10px] text-emerald-900 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                Total Bill
              </span>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-emerald-900 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalMonthlySales)}>
              {formatRupees(totalMonthlySales)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              {selectedCustomerObj ? `${selectedCustomerObj.name.slice(0, 14)}...` : 'Excl. old previous bal'}
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
              <span className="truncate">Paid Received</span>
              <span className="text-[9px] sm:text-[10px] text-sky-900 font-bold bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300 shrink-0">
                Cash / Online
              </span>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-sky-900 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalMonthlyCashReceived)}>
              {formatRupees(totalMonthlyCashReceived)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              Paid in {MONTH_NAMES[selectedMonth].slice(0, 3)}
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
                totalMonthlyRemaining > 0
                  ? 'text-amber-950 bg-amber-100 border-amber-300'
                  : 'text-emerald-950 bg-emerald-100 border-emerald-300'
              }`}>
                Baqaya
              </span>
            </div>
            <div className={`text-base sm:text-lg lg:text-2xl font-black font-mono tabular-nums truncate tracking-tight py-0.5 ${
              totalMonthlyRemaining > 0 ? 'text-amber-900' : 'text-emerald-900'
            }`} title={formatRupees(totalMonthlyRemaining)}>
              {formatRupees(totalMonthlyRemaining)}
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
                Volume
              </span>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-slate-900 tabular-nums py-0.5">
              {invoiceCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              {selectedCustomerObj ? 'Invoices for client' : 'Bills in selected month'}
            </div>
          </div>
        </div>

        {/* Detailed Invoice Table */}
        <div className={`bg-white p-4 sm:p-5 rounded-xl space-y-4 ${
          selectedTemplate === 'compact' ? 'border border-dashed border-slate-400' : 'border border-slate-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {selectedCustomerObj ? `${selectedCustomerObj.name} — Invoices` : 'Detailed Invoices'}{' '}
                for {MONTH_NAMES[selectedMonth]} {selectedYear}
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
              <span className="text-[11px] font-mono font-bold text-slate-700">
                {filteredMonthInvoices.length} {filteredMonthInvoices.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          </div>

          {filteredMonthInvoices.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <i className="fa-solid fa-calendar-xmark text-3xl text-slate-300"></i>
              <p className="text-xs text-slate-600 font-medium">
                No invoices found for {selectedCustomerObj ? selectedCustomerObj.name : 'this period'} in{' '}
                {MONTH_NAMES[selectedMonth]} {selectedYear}.
              </p>
              {selectedCustomerObj && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('all')}
                  className="text-xs font-semibold text-emerald-700 hover:underline pt-1 inline-block"
                >
                  View all store invoices for {MONTH_NAMES[selectedMonth]}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                <thead>
                  <tr className={`uppercase tracking-wider font-bold ${
                    selectedTemplate === 'elegant' ? 'bg-emerald-900 text-white text-[11px]' :
                    selectedTemplate === 'classic' ? 'bg-blue-900 text-white text-[11px]' :
                    selectedTemplate === 'compact' ? 'border-b border-dashed border-slate-600 text-slate-900 text-[10px]' :
                    'border-b-2 border-slate-300 bg-slate-100 text-[11px] text-slate-900'
                  }`}>
                    <th className="py-2.5 px-3 w-24">Invoice #</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3">Client Name</th>
                    <th className="py-2.5 px-3 text-right min-w-[110px]">
                      Total Bill
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[110px]">
                      Payment Received
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[110px]">
                      Remaining (Baqaya)
                    </th>
                    <th className="py-2.5 px-3 text-center w-20 print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${selectedTemplate === 'compact' ? 'divide-dashed divide-slate-300 font-mono' : 'divide-slate-200 font-sans'}`}>
                  {filteredMonthInvoices.map((inv) => {
                    const bill = Number(inv.subtotal) || 0;
                    const paid = Number(inv.paymentReceived) || 0;
                    const baqaya = bill - paid;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          #{inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                          {formatDate(inv.invoiceDate)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerId(inv.customerName)}
                            className="hover:text-emerald-800 hover:underline text-left font-bold cursor-pointer"
                            title="Filter statement for this customer"
                          >
                            {inv.customerName}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-900 bg-emerald-50/40 text-sm">
                          {formatRupees(bill)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-sky-900 bg-sky-50/40 text-sm">
                          {formatRupees(paid)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold bg-amber-50/40 text-sm">
                          <span className={baqaya > 0 ? 'text-amber-900' : 'text-emerald-800'}>
                            {formatRupees(baqaya)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            {onShareWhatsApp && (
                              <button
                                type="button"
                                onClick={() => onShareWhatsApp(inv)}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Share on WhatsApp"
                              >
                                <i className="fa-brands fa-whatsapp text-sm"></i>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onPreviewInvoice(inv)}
                              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                              title="View & Print Invoice"
                            >
                              <i className="fa-solid fa-print text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Monthly Totals Footer Row */}
                  <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold">
                    <td colSpan={3} className="py-3 px-3 text-slate-950 text-right uppercase text-[11px]">
                      Total for {selectedCustomerObj ? selectedCustomerObj.name : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}:
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-950 text-sm sm:text-base bg-emerald-200/60 font-black">
                      {formatRupees(totalMonthlySales)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-950 text-sm sm:text-base bg-sky-200/60 font-black">
                      {formatRupees(totalMonthlyCashReceived)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-950 text-sm sm:text-base bg-amber-200/60 font-black">
                      {formatRupees(totalMonthlyRemaining)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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


