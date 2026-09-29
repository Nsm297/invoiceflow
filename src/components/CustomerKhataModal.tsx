import React, { useState } from 'react';
import { Customer, Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate } from '../utils/formatters';

interface CustomerKhataModalProps {
  customer: Customer;
  invoices: Invoice[];
  businessInfo: BusinessInfo;
  onClose: () => void;
  onCreateInvoice: (customer: Customer) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const CustomerKhataModal: React.FC<CustomerKhataModalProps> = ({
  customer,
  invoices,
  businessInfo,
  onClose,
  onCreateInvoice,
  onViewInvoice,
}) => {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const opBal = Number(
    customer.openingBalance !== undefined
      ? customer.openingBalance
      : customer.previousBalance || 0
  );

  // Filter invoices strictly belonging to this customer (by ID or matching name)
  const custId = customer.id;
  const custNameLower = (customer.name || '').trim().toLowerCase();

  const allCustInvoices = invoices.filter((inv) => {
    if (custId && inv.customerId && inv.customerId === custId) return true;
    if (custNameLower && inv.customerName && inv.customerName.trim().toLowerCase() === custNameLower) {
      return true;
    }
    return false;
  });

  // Sort chronological (oldest to newest for running ledger)
  const sortedInvoices = [...allCustInvoices].sort(
    (a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
  );

  // Calculate Running Ledger Entries
  let runningLedger = opBal;
  const ledgerEntries = sortedInvoices.map((inv) => {
    const subtotal = Number(inv.subtotal) || 0;
    const paid = Number(inv.paymentReceived) || 0;
    runningLedger = runningLedger + subtotal - paid;
    return {
      invoice: inv,
      subtotal,
      paid,
      invoiceRemaining: Number(inv.remainingBalance) || (subtotal - paid),
      runningBalance: runningLedger,
    };
  });

  // Overall Financial Totals
  const totalPurchases = sortedInvoices.reduce(
    (sum, inv) => sum + (Number(inv.subtotal) || 0),
    0
  );
  const totalPaid = sortedInvoices.reduce(
    (sum, inv) => sum + (Number(inv.paymentReceived) || 0),
    0
  );
  const netDueBalance = opBal + totalPurchases - totalPaid;

  // Filtered view if date range specified
  const filteredEntries = ledgerEntries.filter((entry) => {
    const invDate = entry.invoice.invoiceDate;
    if (filterStartDate && invDate < filterStartDate) return false;
    if (filterEndDate && invDate > filterEndDate) return false;
    return true;
  });

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const storeTitle = businessInfo.name || 'Store';
    const storeContact = businessInfo.phone ? `\n📞 *Contact:* ${businessInfo.phone}` : '';

    const message = `*📊 CUSTOMER ACCOUNT STATEMENT (KHATA)*
━━━━━━━━━━━━━━━━━━━━
🏪 *Store:* ${storeTitle}${storeContact}
👤 *Customer:* ${customer.name}
📱 *Phone:* ${customer.phone}
📅 *Date:* ${todayStr}
━━━━━━━━━━━━━━━━━━━━
*1. Opening Balance:* ${formatRupees(opBal)}
*2. Total Purchases (${sortedInvoices.length} Invoices):* ${formatRupees(totalPurchases)}
*3. Total Payments Received:* ${formatRupees(totalPaid)}
━━━━━━━━━━━━━━━━━━━━
*💰 NET DUE BALANCE (BAQAYA):* ${formatRupees(netDueBalance)}
━━━━━━━━━━━━━━━━━━━━
${netDueBalance > 0 ? `⚠️ *Please clear your pending balance of ${formatRupees(netDueBalance)} at your earliest convenience.*` : `✅ *Your account is fully cleared. Thank you!*`}

_Generated via ${storeTitle} POS System_`;

    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:max-w-none">
        {/* Modal Top Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <i className="fa-solid fa-book-open"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {customer.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  Client Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>
                  <i className="fa-solid fa-phone text-[10px] mr-1 text-slate-400"></i>
                  {customer.phone}
                </span>
                <span>•</span>
                <span>{sortedInvoices.length} Total Invoices</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors min-h-[36px]"
              title="Share Khata statement on WhatsApp"
            >
              <i className="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
              <span>Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors min-h-[36px]"
              title="Print Customer Statement PDF"
            >
              <i className="fa-solid fa-print text-xs"></i>
              <span>Print Statement</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateInvoice(customer);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors min-h-[36px]"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>New Bill</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Printable Official Statement Header (Visible only when Printing) */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {businessInfo.name || 'Store Statement'}
              </h1>
              {businessInfo.tagline && (
                <p className="text-xs text-slate-500">{businessInfo.tagline}</p>
              )}
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                {businessInfo.address && <p>{businessInfo.address}</p>}
                {businessInfo.phone && <p>Phone: {businessInfo.phone}</p>}
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded tracking-wider uppercase mb-1">
                Customer Ledger Statement
              </div>
              <p className="text-xs text-slate-600">
                Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Name:</span>
              <p className="font-bold text-sm text-slate-900">{customer.name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Contact Phone:</span>
              <p className="font-mono text-slate-800">{customer.phone}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 print:overflow-visible print:p-6">
          {/* Summary Cards: 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Opening Balance */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  1. Opening Balance
                </span>
                <i className="fa-solid fa-clock-rotate-left text-xs text-slate-400"></i>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-slate-800 mt-1">
                {formatRupees(opBal)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Initial starting balance</div>
            </div>

            {/* 2. Total Purchases / Subtotals */}
            <div className="bg-blue-50/60 p-3.5 sm:p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  2. Total Purchases
                </span>
                <i className="fa-solid fa-bag-shopping text-xs text-blue-500"></i>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-blue-900 mt-1">
                {formatRupees(totalPurchases)}
              </div>
              <div className="text-[10px] text-blue-600/80 mt-0.5">
                {sortedInvoices.length} bill{sortedInvoices.length === 1 ? '' : 's'} subtotal sum
              </div>
            </div>

            {/* 3. Total Paid Amount */}
            <div className="bg-emerald-50/60 p-3.5 sm:p-4 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  3. Total Payments
                </span>
                <i className="fa-solid fa-money-bill-wave text-xs text-emerald-500"></i>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-emerald-900 mt-1">
                {formatRupees(totalPaid)}
              </div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">Total received cash</div>
            </div>

            {/* 4. Current Net Due Balance */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border ${
                netDueBalance > 0
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-emerald-50/80 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    netDueBalance > 0 ? 'text-amber-800' : 'text-emerald-800'
                  }`}
                >
                  4. Current Net Due
                </span>
                <i
                  className={`fa-solid ${
                    netDueBalance > 0
                      ? 'fa-triangle-exclamation text-amber-600'
                      : 'fa-circle-check text-emerald-600'
                  } text-xs`}
                ></i>
              </div>
              <div
                className={`text-base sm:text-xl font-bold font-mono mt-1 ${
                  netDueBalance > 0 ? 'text-amber-900' : 'text-emerald-900'
                }`}
              >
                {formatRupees(netDueBalance)}
              </div>
              <div
                className={`text-[10px] mt-0.5 font-medium ${
                  netDueBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                (Opening + Purchases − Paid)
              </div>
            </div>
          </div>

          {/* Ledger Breakdown Filter Bar (Hidden in Print) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Transaction History (Roznamcha)
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">
                {filteredEntries.length} Records
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">From:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded-md bg-white text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">To:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded-md bg-white text-xs"
                />
              </div>
              {(filterStartDate || filterEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200 tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Items / Notes</th>
                    <th className="py-2.5 px-3 text-right">Bill Subtotal (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Paid (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Running Ledger (Rs.)</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* Initial Opening Balance Row */}
                  <tr className="bg-slate-50/50 italic text-slate-600 font-sans">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {customer.createdAt ? formatDate(customer.createdAt) : 'Opening'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-500">
                      OPENING-BAL
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      Initial starting balance recorded
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                      {formatRupees(opBal)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">
                      -
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupees(opBal)}
                    </td>
                    <td className="py-2 px-3 text-center print:hidden text-slate-400">
                      —
                    </td>
                  </tr>

                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        <i className="fa-solid fa-receipt text-2xl mb-1 block text-slate-300"></i>
                        No invoice billing history found for this customer.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const inv = entry.invoice;
                      const itemsPreview =
                        inv.items && inv.items.length > 0
                          ? inv.items
                              .map((i) => `${i.name} (${i.quantity}x @ ${formatRupees(i.unitPrice)})`)
                              .join(', ')
                          : 'No items';

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/80 transition-colors font-sans"
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            {formatDate(inv.invoiceDate)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                            #{inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate text-slate-600 text-xs font-sans" title={itemsPreview}>
                            {itemsPreview}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {formatRupees(entry.subtotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700">
                            {entry.paid > 0 ? formatRupees(entry.paid) : 'Rs. 0.00'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            <span
                              className={
                                entry.runningBalance > 0
                                  ? 'text-amber-800'
                                  : 'text-emerald-700'
                              }
                            >
                              {formatRupees(entry.runningBalance)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            {onViewInvoice && (
                              <button
                                type="button"
                                onClick={() => onViewInvoice(inv)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                                title="View & Print invoice"
                              >
                                <i className="fa-solid fa-eye mr-1"></i> View
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Statement Signatures Block */}
          <div className="hidden print:flex justify-between items-end pt-12 text-xs text-slate-600">
            <div className="text-center w-48">
              <div className="border-b border-slate-400 pb-1 font-mono font-semibold">
                {customer.name}
              </div>
              <p className="mt-1 text-[10px] text-slate-500 uppercase">Customer Signature</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-slate-400 pb-1 font-mono font-semibold">
                {businessInfo.name || 'Authorized Sign'}
              </div>
              <p className="mt-1 text-[10px] text-slate-500 uppercase">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden in Print) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-slate-500">
            Current Outstanding Balance:{' '}
            <span className="font-bold font-mono text-slate-900 text-sm">
              {formatRupees(netDueBalance)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-print mr-1"></i> Print Statement
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
