import React, { useState, useMemo } from 'react';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { formatRupees } from '../utils/formatters';

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

  // Available years from invoices
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
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
  // This avoids double counting customer carried-forward balances.
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
      // Remaining Balance strictly = Period Sales minus Period Payments
      m.remainingBalance = m.sales - m.cashReceived;
    });

    return months;
  }, [filteredYearInvoices]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        {/* Filter Dropdowns & Print Actions */}
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

          {/* Print Annual Statement Button */}
          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs min-h-[38px] ${
              selectedCustomerObj
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <i className="fa-solid fa-print text-xs"></i>
            <span>{selectedCustomerObj ? 'Print Customer Statement' : 'Print Annual Report'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards: Responsive font sizes to prevent overflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Total Yearly Sales / Total Bill */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">{selectedCustomerObj ? 'Client Sales' : 'Yearly Sales'}</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
              Total Bill
            </span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-emerald-800 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalYearlySales)}>
            {formatRupees(totalYearlySales)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            {selectedCustomerObj ? `${selectedCustomerObj.name.slice(0, 14)}...` : `All bills in ${selectedYear}`}
          </div>
        </div>

        {/* 2. Total Payment Received */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">Payment Received</span>
            <span className="text-[9px] sm:text-[10px] text-sky-800 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
              Collected
            </span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-sky-800 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalYearlyCashReceived)}>
            {formatRupees(totalYearlyCashReceived)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            Paid in year {selectedYear}
          </div>
        </div>

        {/* 3. Total Remaining Balance (Baqaya) */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">Remaining</span>
            <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
              totalYearlyRemaining > 0
                ? 'text-amber-800 bg-amber-50 border-amber-200'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200'
            }`}>
              Baqaya
            </span>
          </div>
          <div className={`text-base sm:text-lg lg:text-2xl font-black font-mono tabular-nums truncate tracking-tight py-0.5 ${
            totalYearlyRemaining > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`} title={formatRupees(totalYearlyRemaining)}>
            {formatRupees(totalYearlyRemaining)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            Sales minus Payments
          </div>
        </div>

        {/* 4. Total Invoices Count */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">Invoices</span>
            <span className="text-[9px] sm:text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
              Year {selectedYear}
            </span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-slate-900 tabular-nums py-0.5">
            {totalInvoicesCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            {selectedCustomerObj ? 'Invoices for client' : `Invoices created in ${selectedYear}`}
          </div>
        </div>

      </div>

      {/* 12-Month Summary Table with Clean Zero-Value Formatting */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
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
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline"
              >
                Clear Customer Filter
              </button>
            )}
            <span className="text-[11px] font-mono text-slate-500">12 Months Summary</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700">
                <th className="py-2.5 px-3 sm:px-4 font-semibold">Month</th>
                <th className="py-2.5 px-3 sm:px-4 font-semibold text-center w-20">Invoices</th>
                <th className="py-2.5 px-3 sm:px-4 font-bold text-emerald-800 text-right bg-emerald-50/50">
                  Total Sales / Total Bill
                </th>
                <th className="py-2.5 px-3 sm:px-4 font-bold text-sky-800 text-right bg-sky-50/50">
                  Total Payment Received
                </th>
                <th className="py-2.5 px-3 sm:px-4 font-bold text-amber-800 text-right bg-amber-50/50">
                  Remaining Balance (Baqaya)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBreakdown.map((m) => {
                const isZero = m.count === 0 && m.sales === 0 && m.cashReceived === 0;

                return (
                  <tr
                    key={m.index}
                    className={`transition-colors ${
                      isZero ? 'hover:bg-slate-50/40 text-slate-400' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 ${
                        isZero ? 'font-normal text-slate-400' : 'font-semibold text-slate-800'
                      }`}
                    >
                      {m.name}
                    </td>

                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-center font-mono tabular-nums ${
                        isZero ? 'text-slate-300' : 'text-slate-700 font-semibold'
                      }`}
                    >
                      {isZero ? '0' : m.count}
                    </td>

                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-xs sm:text-sm ${
                        isZero
                          ? 'text-slate-300 font-normal'
                          : 'font-bold text-emerald-800 bg-emerald-50/30'
                      }`}
                    >
                      {formatRupees(m.sales)}
                    </td>

                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-xs sm:text-sm ${
                        isZero
                          ? 'text-slate-300 font-normal'
                          : 'font-bold text-sky-800 bg-sky-50/30'
                      }`}
                    >
                      {formatRupees(m.cashReceived)}
                    </td>

                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-xs sm:text-sm ${
                        isZero
                          ? 'text-slate-300 font-normal'
                          : m.remainingBalance > 0
                          ? 'font-bold text-amber-800 bg-amber-50/30'
                          : 'font-bold text-emerald-700 bg-emerald-50/20'
                      }`}
                    >
                      {formatRupees(m.remainingBalance)}
                    </td>
                  </tr>
                );
              })}

              {/* Annual Totals Footer Row */}
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                <td className="py-3 px-3 sm:px-4 text-slate-900 text-xs sm:text-sm uppercase">
                  Total {selectedCustomerObj ? selectedCustomerObj.name : selectedYear}
                </td>
                <td className="py-3 px-3 sm:px-4 text-center font-mono tabular-nums text-slate-900 text-xs sm:text-sm">
                  {totalInvoicesCount}
                </td>
                <td className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-emerald-800 text-xs sm:text-base bg-emerald-100/50">
                  {formatRupees(totalYearlySales)}
                </td>
                <td className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-sky-800 text-xs sm:text-base bg-sky-100/50">
                  {formatRupees(totalYearlyCashReceived)}
                </td>
                <td className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums text-amber-800 text-xs sm:text-base bg-amber-100/50">
                  {formatRupees(totalYearlyRemaining)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
