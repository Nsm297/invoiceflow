import React, { useState } from 'react';
import { Customer, Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees } from '../utils/formatters';
import { getCustomerRunningBalance } from '../utils/storage';
import { CustomerKhataModal } from './CustomerKhataModal';

interface CustomerModuleProps {
  customers: Customer[];
  invoices?: Invoice[];
  businessInfo?: BusinessInfo;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onCreateInvoiceForCustomer: (customer: Customer) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  customers,
  invoices = [],
  businessInfo = {
    name: 'InvoiceFlow',
    phone: '',
    address: '',
    tagline: '',
  },
  onSaveCustomer,
  onDeleteCustomer,
  onCreateInvoiceForCustomer,
  onViewInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setPhone('');
    setOpeningBalance(0);
    setError('');
    setEditingCustomer(null);
    setIsAddingNew(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setOpeningBalance(c.openingBalance !== undefined ? c.openingBalance : (c.previousBalance || 0));
    setError('');
    setIsAddingNew(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    const numericOpening = Number(openingBalance) || 0;

    const customerObj: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      openingBalance: numericOpening,
      previousBalance: numericOpening,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(customerObj);
    setIsAddingNew(false);
    setEditingCustomer(null);
  };

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

  const totalOutstandingBalance = customers.reduce(
    (sum, c) => sum + getCustomerRunningBalance(c, invoices),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Customer Management</h2>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              {customers.length} {customers.length === 1 ? 'Customer' : 'Customers'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Set customer Opening Balances once and track dynamic running ledger balances across all invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all active:scale-[0.98] min-h-[38px]"
          >
            <i className="fa-solid fa-user-plus text-xs"></i>
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Saved Customers
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {customers.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Outstanding Balance (Current)
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {formatRupees(totalOutstandingBalance)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Customers with Dues
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {customers.filter((c) => getCustomerRunningBalance(c, invoices) > 0).length}
          </div>
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
            placeholder="Search by customer name or phone number..."
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

      {/* Customer List Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <i className="fa-solid fa-users text-4xl text-slate-300"></i>
          <h3 className="text-sm font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {searchQuery
              ? 'No customer matched your search query. Try searching with a different name or phone.'
              : 'You have not added any customers yet. Add your first customer with their opening balance to get started.'}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Add First Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const isConfirmingDelete = confirmDeleteId === c.id;
            const runningBal = getCustomerRunningBalance(c, invoices);
            const opBal = c.openingBalance !== undefined ? c.openingBalance : (c.previousBalance || 0);

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <i className="fa-solid fa-phone text-[10px] text-slate-400"></i>
                        <a href={`tel:${c.phone}`} className="hover:text-slate-900 underline-offset-2">
                          {c.phone}
                        </a>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Opening vs Running Balance Box */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Opening Balance (Set Once):</span>
                      <span className="font-mono font-medium text-slate-700">
                        {formatRupees(opBal)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100/60">
                      <span className="text-[11px] font-bold text-slate-700">Current Running Balance:</span>
                      <span
                        className={`text-base font-bold font-mono tabular-nums ${
                          runningBal > 0 ? 'text-amber-800' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupees(runningBal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedKhataCustomer(c)}
                    className="flex-1 py-1.5 px-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[36px] shadow-xs"
                    title="View Statement / Khata"
                  >
                    <i className="fa-solid fa-book-open text-xs text-amber-400"></i>
                    <span>View Khata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateInvoiceForCustomer(c)}
                    className="py-1.5 px-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors min-h-[36px]"
                    title="Generate invoice with this customer"
                  >
                    <i className="fa-solid fa-file-invoice text-xs"></i>
                    <span>Bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit customer and opening balance"
                    aria-label="Edit customer"
                  >
                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                  </button>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteCustomer(c.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 text-[10px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-1 text-[10px] text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(c.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete customer"
                      aria-label="Delete customer"
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

      {/* Add / Edit Customer Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmed Ali or Rashid General Store"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Balance (Rs.) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-semibold pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Initial starting balance set ONCE for this customer. All invoice bills and payments will dynamically update their running balance.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors min-h-[38px]"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Khata & Statement Modal */}
      {selectedKhataCustomer && (
        <CustomerKhataModal
          customer={selectedKhataCustomer}
          invoices={invoices}
          businessInfo={businessInfo}
          onClose={() => setSelectedKhataCustomer(null)}
          onCreateInvoice={(cust) => {
            setSelectedKhataCustomer(null);
            onCreateInvoiceForCustomer(cust);
          }}
          onViewInvoice={onViewInvoice}
        />
      )}
    </div>
  );
};
