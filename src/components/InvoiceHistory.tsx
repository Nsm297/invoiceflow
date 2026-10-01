import React, { useState } from 'react';
import { Invoice } from '../types/invoice';
import { formatRupees, formatDate, exportInvoicesToCSV } from '../utils/formatters';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  onPreviewInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onShareWhatsApp: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onCreateNewForCustomer?: (customerName: string, customerPhone?: string, previousBalance?: number) => void;
  onCreateNew: () => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  invoices,
  onPreviewInvoice,
  onDeleteInvoice,
  onShareWhatsApp,
  onEditInvoice,
  onCreateNewForCustomer,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchCustomer = (inv.customerName || '').toLowerCase().includes(q);
    const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(q);
    const matchPhone = (inv.customerPhone || '').toLowerCase().includes(q);
    const matchItems = inv.items?.some((it) => it.name.toLowerCase().includes(q));
    return matchCustomer || matchNumber || matchPhone || matchItems;
  });

  return (
    <div id="history-report-area" className="space-y-6 export-card-wrapper">
      {/* Header bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Invoice History</h2>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Cards list of all generated invoices with Search, Delete, Print PDF, and WhatsApp Share.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportInvoicesToCSV(filteredInvoices)}
            disabled={!filteredInvoices.length}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors min-h-[36px]"
          >
            <i className="fa-solid fa-file-csv text-emerald-700 text-xs"></i>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-[0.98] min-h-[36px]"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, invoice number, or item name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[38px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-0.5"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Invoices List View (Clean Card Layout) */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <i className="fa-solid fa-receipt text-4xl text-slate-300"></i>
          <h3 className="text-sm font-bold text-slate-900">No Invoices Found</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {searchQuery
              ? 'No invoice records matched your search query.'
              : 'You have not created any invoices yet. Generate your first invoice to view history.'}
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Create First Invoice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvoices.map((inv) => {
            const isConfirmingDelete = confirmDeleteId === inv.id;
            const totalBill = inv.totalBill ?? (inv.grandTotal || (inv.subtotal + (inv.previousBalance || 0)));
            const paymentReceived = inv.paymentReceived || 0;
            const remainingBalance = inv.remainingBalance ?? (totalBill - paymentReceived);

            return (
              <div
                key={inv.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between gap-4"
              >
                {/* Card Top: Number, Date, Customer, Totals */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-slate-400 text-xs">·</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {formatDate(inv.invoiceDate)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {inv.customerName}
                      </h3>
                      {inv.customerPhone && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          <i className="fa-solid fa-phone text-[10px] mr-1 text-slate-400"></i>
                          {inv.customerPhone}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Total Bill
                      </span>
                      <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                        {formatRupees(totalBill)}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                      Items ({inv.items?.length || 0}):
                    </span>
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 max-h-24 overflow-y-auto">
                      {inv.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="truncate pr-2 font-medium">{it.name} (x{it.quantity})</span>
                          <span className="font-mono text-slate-600 shrink-0">
                            {formatRupees(it.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Ledger Breakdown */}
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-medium text-slate-800">{formatRupees(inv.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Previous Balance:</span>
                      <span className="font-mono font-medium text-amber-800">{formatRupees(inv.previousBalance)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 text-[11px] pt-1 border-t border-slate-200">
                      <span className="font-semibold">Payment Received:</span>
                      <span className="font-mono font-bold text-sky-800">{formatRupees(paymentReceived)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-900 text-xs">Remaining Balance:</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            remainingBalance === 0
                              ? 'text-emerald-700'
                              : remainingBalance > 0
                              ? 'text-amber-800'
                              : 'text-sky-700'
                          }`}
                        >
                          {formatRupees(remainingBalance)}
                        </span>
                        {remainingBalance === 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            Paid
                          </span>
                        ) : remainingBalance > 0 ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                            Due
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-sky-800 bg-sky-100/80 px-1.5 py-0.5 rounded">
                            Credit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions: Edit Invoice, WhatsApp Share, Print PDF, Bill Again, and Delete */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                  {/* Edit Invoice Button */}
                  {onEditInvoice && (
                    <button
                      type="button"
                      onClick={() => onEditInvoice(inv)}
                      className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[36px] shadow-xs active:scale-[0.98]"
                      title="Edit this invoice"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                      <span>Edit</span>
                    </button>
                  )}

                  {/* WhatsApp Share Button */}
                  <button
                    type="button"
                    onClick={() => onShareWhatsApp(inv)}
                    className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[36px] shadow-xs active:scale-[0.98]"
                    title="Share invoice on WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp text-sm"></i>
                    <span>Share on WhatsApp</span>
                  </button>

                  {/* Print PDF Button */}
                  <button
                    type="button"
                    onClick={() => onPreviewInvoice(inv)}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[36px]"
                    title="Print / View PDF"
                  >
                    <i className="fa-solid fa-print text-xs"></i>
                    <span>Print PDF</span>
                  </button>

                  {/* Re-bill this customer button */}
                  {onCreateNewForCustomer && (
                    <button
                      type="button"
                      onClick={() =>
                        onCreateNewForCustomer(inv.customerName, inv.customerPhone, remainingBalance)
                      }
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors min-h-[36px]"
                      title="Create next invoice for this customer"
                    >
                      <i className="fa-solid fa-file-circle-plus text-xs"></i>
                    </button>
                  )}

                  {/* Delete Button with confirmation */}
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteInvoice(inv.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(inv.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete invoice"
                      aria-label="Delete invoice"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
