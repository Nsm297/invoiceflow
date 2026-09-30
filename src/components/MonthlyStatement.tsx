import React, { useState, useMemo } from 'react';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate } from '../utils/formatters';

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
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

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
  // Prevents double-counting old carried-forward balances
  const totalMonthlyRemaining = totalMonthlySales - totalMonthlyCashReceived;

  // 4. Total Invoices Count
  const invoiceCount = filteredMonthInvoices.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          {/* Print Statement Button */}
          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs min-h-[38px] ${
              selectedCustomerObj
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title="Print or export statement to PDF"
          >
            <i className="fa-solid fa-print text-xs"></i>
            <span>{selectedCustomerObj ? 'Print Customer Statement' : 'Print Statement'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards: Responsive Font Size for small/mobile viewports */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Total Monthly Sales / Total Bill */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">{selectedCustomerObj ? 'Client Sales' : 'Monthly Sales'}</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
              Total Bill
            </span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-emerald-800 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalMonthlySales)}>
            {formatRupees(totalMonthlySales)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            {selectedCustomerObj ? `${selectedCustomerObj.name.slice(0, 14)}...` : 'Excl. old previous bal'}
          </div>
        </div>

        {/* 2. Total Payment Received */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">Paid Received</span>
            <span className="text-[9px] sm:text-[10px] text-sky-800 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
              Cash / Online
            </span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-sky-800 tabular-nums truncate tracking-tight py-0.5" title={formatRupees(totalMonthlyCashReceived)}>
            {formatRupees(totalMonthlyCashReceived)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            Paid in {MONTH_NAMES[selectedMonth].slice(0, 3)}
          </div>
        </div>

        {/* 3. Total Remaining Balance (Baqaya) */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between gap-1">
            <span className="truncate">Remaining</span>
            <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
              totalMonthlyRemaining > 0
                ? 'text-amber-800 bg-amber-50 border-amber-200'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200'
            }`}>
              Baqaya
            </span>
          </div>
          <div className={`text-base sm:text-lg lg:text-2xl font-black font-mono tabular-nums truncate tracking-tight py-0.5 ${
            totalMonthlyRemaining > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`} title={formatRupees(totalMonthlyRemaining)}>
            {formatRupees(totalMonthlyRemaining)}
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
              Volume
            </span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-black font-mono text-slate-900 tabular-nums py-0.5">
            {invoiceCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            {selectedCustomerObj ? 'Invoices for client' : 'Bills in selected month'}
          </div>
        </div>

      </div>

      {/* Detailed Invoice Table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
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
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline"
              >
                Clear Customer Filter
              </button>
            )}
            <span className="text-[11px] font-mono text-slate-500">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700">
                  <th className="py-2.5 px-3 font-semibold">Invoice #</th>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Client Name</th>
                  <th className="py-2.5 px-3 font-bold text-emerald-800 text-right bg-emerald-50/50">
                    Total Bill (New Sale)
                  </th>
                  <th className="py-2.5 px-3 font-bold text-sky-800 text-right bg-sky-50/50">
                    Payment Received
                  </th>
                  <th className="py-2.5 px-3 font-bold text-amber-800 text-right bg-amber-50/50">
                    Remaining Balance (Baqaya)
                  </th>
                  <th className="py-2.5 px-3 text-center font-semibold w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMonthInvoices.map((inv) => {
                  const bill = Number(inv.subtotal) || 0; // Total Bill for this invoice excluding old previous balance
                  const paid = Number(inv.paymentReceived) || 0;
                  const baqaya = bill - paid;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerId(inv.customerName)}
                          className="hover:text-emerald-700 hover:underline text-left font-semibold"
                          title="Filter statement for this customer"
                        >
                          {inv.customerName}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50/30 text-sm">
                        {formatRupees(bill)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-sky-800 bg-sky-50/30 text-sm">
                        {formatRupees(paid)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold bg-amber-50/30 text-sm">
                        <span className={baqaya > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                          {formatRupees(baqaya)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onShareWhatsApp && (
                            <button
                              type="button"
                              onClick={() => onShareWhatsApp(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Share on WhatsApp"
                            >
                              <i className="fa-brands fa-whatsapp text-sm"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onPreviewInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
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
                <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                  <td colSpan={3} className="py-3 px-3 text-slate-900 text-right uppercase text-[11px]">
                    Total for {selectedCustomerObj ? selectedCustomerObj.name : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}:
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800 text-sm sm:text-base bg-emerald-100/50">
                    {formatRupees(totalMonthlySales)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-800 text-sm sm:text-base bg-sky-100/50">
                    {formatRupees(totalMonthlyCashReceived)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-800 text-sm sm:text-base bg-amber-100/50">
                    {formatRupees(totalMonthlyRemaining)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
