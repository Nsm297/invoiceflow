import React, { useState, useEffect } from 'react';
import { Customer, Invoice, InvoiceItem, BusinessInfo } from '../types/invoice';
import { formatRupees, getNextInvoiceNumber } from '../utils/formatters';
import { getCustomerRunningBalance } from '../utils/storage';

interface InvoiceFormProps {
  customers: Customer[];
  existingInvoices: Invoice[];
  initialInvoice?: Invoice | null;
  preselectedCustomer?: Customer | null;
  businessInfo: BusinessInfo;
  onSaveInvoice: (invoice: Invoice, newCustomerToSave?: Customer, shouldGeneratePDF?: boolean) => void;
  onPreviewInvoice: (invoice: Invoice) => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
  onCancelEdit?: () => void;
  onEditStoreInfo?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  customers,
  existingInvoices,
  initialInvoice,
  preselectedCustomer,
  businessInfo,
  onSaveInvoice,
  onPreviewInvoice,
  onShareWhatsApp,
  onCancelEdit,
  onEditStoreInfo,
}) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  const [invoiceId, setInvoiceId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(getToday());

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('custom');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [previousBalance, setPreviousBalance] = useState<number | ''>(0);
  const [saveCustomerCheckbox, setSaveCustomerCheckbox] = useState<boolean>(false);

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `it-${Date.now()}-1`,
      name: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    },
  ]);

  // Payment Received Input
  const [paymentReceived, setPaymentReceived] = useState<number | ''>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form to completely empty state
  const resetFormToEmpty = (customNextNum?: string) => {
    setInvoiceId(`inv-${Date.now()}`);
    setInvoiceNumber(customNextNum || getNextInvoiceNumber(existingInvoices));
    setInvoiceDate(getToday());

    setSelectedCustomerId('custom');
    setCustomerName('');
    setCustomerPhone('');
    setPreviousBalance(0);
    setPaymentReceived('');
    setSaveCustomerCheckbox(false);

    setItems([
      {
        id: `it-${Date.now()}-1`,
        name: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
    setErrors({});
  };

  // Initialize or reset form based on incoming props
  useEffect(() => {
    if (initialInvoice) {
      setInvoiceId(initialInvoice.id);
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setInvoiceDate(initialInvoice.invoiceDate || getToday());
      setSelectedCustomerId(initialInvoice.customerId || 'custom');
      setCustomerName(initialInvoice.customerName);
      setCustomerPhone(initialInvoice.customerPhone || '');
      setPreviousBalance(initialInvoice.previousBalance || 0);
      setPaymentReceived(initialInvoice.paymentReceived !== undefined ? initialInvoice.paymentReceived : '');
      setItems(
        initialInvoice.items?.length
          ? initialInvoice.items
          : [{ id: `it-${Date.now()}`, name: '', quantity: 1, unitPrice: 0, amount: 0 }]
      );
    } else if (preselectedCustomer) {
      setInvoiceId(`inv-${Date.now()}`);
      setInvoiceNumber(getNextInvoiceNumber(existingInvoices));
      setInvoiceDate(getToday());
      setSelectedCustomerId(preselectedCustomer.id);
      setCustomerName(preselectedCustomer.name);
      setCustomerPhone(preselectedCustomer.phone);
      const dynamicBal = getCustomerRunningBalance(preselectedCustomer, existingInvoices);
      setPreviousBalance(dynamicBal);
      setPaymentReceived('');
      setItems([
        {
          id: `it-${Date.now()}-1`,
          name: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
    } else {
      resetFormToEmpty();
    }
  }, [initialInvoice, preselectedCustomer, existingInvoices]);

  // Customer dropdown selection
  const handleCustomerSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCustomerId(val);

    if (val === 'custom') {
      setCustomerName('');
      setCustomerPhone('');
      setPreviousBalance(0);
    } else {
      const found = customers.find((c) => c.id === val);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
        const dynamicBal = getCustomerRunningBalance(found, existingInvoices, initialInvoice ? initialInvoice.id : undefined);
        setPreviousBalance(dynamicBal);
      }
    }
  };

  // Line item manipulation
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'name') {
      current.name = String(value);
    } else if (field === 'quantity') {
      const q = Math.max(0, Number(value));
      current.quantity = q;
      current.amount = Math.round(q * current.unitPrice * 100) / 100;
    } else if (field === 'unitPrice') {
      const p = Math.max(0, Number(value));
      current.unitPrice = p;
      current.amount = Math.round(current.quantity * p * 100) / 100;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = (presetName?: string, presetPrice?: number) => {
    const newItem: InvoiceItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: presetName || '',
      quantity: 1,
      unitPrice: presetPrice !== undefined ? presetPrice : 0,
      amount: presetPrice !== undefined ? presetPrice : 0,
    };
    // If only one empty row exists and preset clicked, replace it
    if (items.length === 1 && !items[0].name.trim() && items[0].unitPrice === 0 && presetName) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ id: `it-${Date.now()}`, name: '', quantity: 1, unitPrice: 0, amount: 0 }]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Automatic Calculations:
  // Items Subtotal = Sum of (Qty × Unit Price)
  // Total Bill = Items Subtotal + Previous Balance
  // Remaining Balance = Total Bill - Payment Received
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const numericPrevBalance = Number(previousBalance) || 0;
  const totalBill = itemsSubtotal + numericPrevBalance;
  const numericPaymentReceived = paymentReceived === '' ? 0 : Number(paymentReceived) || 0;
  const remainingBalance = totalBill - numericPaymentReceived;

  const buildInvoiceObject = (): Invoice => {
    return {
      id: invoiceId || `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || 'INV-001',
      customerId: selectedCustomerId !== 'custom' ? selectedCustomerId : undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      invoiceDate,
      items,
      subtotal: itemsSubtotal,
      previousBalance: numericPrevBalance,
      totalBill: totalBill,
      paymentReceived: numericPaymentReceived,
      remainingBalance: remainingBalance,
      grandTotal: totalBill, // Kept for backwards compatibility
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!customerName.trim()) {
      errs.customer = 'Please enter or select a customer name';
    }
    if (!invoiceNumber.trim()) {
      errs.invoiceNumber = 'Invoice number is required';
    }
    const hasItem = items.some((it) => it.name.trim() !== '' && it.quantity > 0);
    if (!hasItem) {
      errs.items = 'Please provide at least one item with a description and quantity';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save Invoice & Auto-Reset
  const handleSaveOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    let newCust: Customer | undefined;
    if (selectedCustomerId === 'custom' && saveCustomerCheckbox && customerName.trim()) {
      const initOpening = Number(previousBalance) || 0;
      newCust = {
        id: `cust-${Date.now()}`,
        name: customerName.trim(),
        phone: customerPhone.trim() || 'N/A',
        openingBalance: initOpening,
        previousBalance: initOpening,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const invoice = buildInvoiceObject();
    onSaveInvoice(invoice, newCust, false);

    // Auto-Reset: automatically reset/clear all input fields so the form becomes completely empty for the next invoice
    resetFormToEmpty();
  };

  // Generate PDF & Auto-Reset
  const handleGeneratePDF = () => {
    if (!validate()) return;

    let newCust: Customer | undefined;
    if (selectedCustomerId === 'custom' && saveCustomerCheckbox && customerName.trim()) {
      const initOpening = Number(previousBalance) || 0;
      newCust = {
        id: `cust-${Date.now()}`,
        name: customerName.trim(),
        phone: customerPhone.trim() || 'N/A',
        openingBalance: initOpening,
        previousBalance: initOpening,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const invoice = buildInvoiceObject();
    // Save to localStorage, open PDF preview modal, and auto-reset form
    onSaveInvoice(invoice, newCust, true);

    // Auto-reset form fields
    resetFormToEmpty();
  };

  const handleShareWhatsAppDirect = () => {
    if (!validate()) return;
    const invoice = buildInvoiceObject();
    if (onShareWhatsApp) {
      onShareWhatsApp(invoice);
    }
  };

  return (
    <form onSubmit={handleSaveOnly} className="space-y-6">
      {/* Store Info Banner Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 mt-0.5">
            <i className="fa-solid fa-store"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {businessInfo.name}
              </h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                Active Store
              </span>
            </div>
            {businessInfo.tagline && (
              <p className="text-xs text-slate-600 font-medium italic mt-0.5">
                {businessInfo.tagline}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-phone text-[10px] text-slate-400"></i>
                <strong className="text-slate-700 font-semibold">{businessInfo.phone}</strong>
              </span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span className="flex items-center gap-1 truncate max-w-md">
                <i className="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                <span>{businessInfo.address}</span>
              </span>
            </div>
          </div>
        </div>

        {onEditStoreInfo && (
          <button
            type="button"
            onClick={onEditStoreInfo}
            className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 min-h-[34px]"
            title="Edit shop details, phone number and address"
          >
            <i className="fa-solid fa-pen-to-square text-xs"></i>
            <span>Edit Store Info</span>
          </button>
        )}
      </div>

      {/* Top Banner when editing an existing invoice */}
      {initialInvoice && (
        <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between shadow-sm border border-amber-500/50">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
              <i className="fa-solid fa-pen-to-square text-amber-400"></i>
              <span>Edit Mode</span>
            </span>
            <span className="text-sm font-mono font-bold text-white">#{initialInvoice.invoiceNumber}</span>
            <span className="text-xs text-slate-300">({initialInvoice.customerName})</span>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
              <span>Cancel Edit</span>
            </button>
          )}
        </div>
      )}

      {/* Action Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {initialInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Auto-fetches previous balance · Auto-calculates Total Bill & Remaining Balance · Auto-resets on save.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reset / Clear Form */}
          <button
            type="button"
            onClick={() => resetFormToEmpty()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[36px]"
            title="Clear all fields"
          >
            <i className="fa-solid fa-arrows-rotate text-xs"></i>
            <span>Clear Form</span>
          </button>

          {/* WhatsApp Direct Share */}
          {onShareWhatsApp && (
            <button
              type="button"
              onClick={handleShareWhatsAppDirect}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-lg transition-colors min-h-[36px] shadow-xs active:scale-[0.98]"
              title="Share invoice on WhatsApp"
            >
              <i className="fa-brands fa-whatsapp text-sm"></i>
              <span>WhatsApp</span>
            </button>
          )}

          {/* Generate PDF Button (Saves & Auto-resets form) */}
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[36px]"
            title="Save and open clean PDF print preview"
          >
            <i className="fa-solid fa-file-pdf text-rose-600 text-xs"></i>
            <span>Generate PDF</span>
          </button>

          {/* Save Invoice Button (Saves & Auto-resets form) */}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all active:scale-[0.98] min-h-[36px]"
            title="Save invoice to history and reset form"
          >
            <i className="fa-solid fa-floppy-disk text-xs"></i>
            <span>{initialInvoice ? 'Update Invoice' : 'Save Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Columns (Customer, Meta, Items) & Right Column (Ledger Calculation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Selection Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-user-tag text-emerald-700"></i>
                <span>Customer Selection</span>
              </h3>
              <span className="text-[11px] text-slate-600">Auto-fetches phone & previous balance</span>
            </div>

            {errors.customer && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                {errors.customer}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Dropdown (Select Saved Customer)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelectChange}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                >
                  <option value="custom">+ Type New Customer Manually</option>
                  {customers.map((c) => {
                    const dynamicBal = getCustomerRunningBalance(c, existingInvoices, initialInvoice ? initialInvoice.id : undefined);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — Current Balance: {formatRupees(dynamicBal)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (selectedCustomerId !== 'custom') setSelectedCustomerId('custom');
                    }}
                    placeholder="e.g. Ahmed Ali & Sons"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                  />
                </div>
              </div>

              {/* If manual customer, option to save */}
              {selectedCustomerId === 'custom' && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={saveCustomerCheckbox}
                      onChange={(e) => setSaveCustomerCheckbox(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Save this new customer in Customers directory with their updated balance</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Meta: Number & Date */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-hashtag text-slate-500"></i>
                <span>Invoice Identifier & Date</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-001"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
                {errors.invoiceNumber && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.invoiceNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>
            </div>
          </div>

          {/* Items List Section */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-boxes-stacked text-emerald-700"></i>
                  <span>Items List <span className="text-rose-500">*</span></span>
                </h3>
                <p className="text-[11px] text-slate-600">Enter item name, quantity, and unit price in Rs.</p>
              </div>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[36px]"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Add Item Row</span>
              </button>
            </div>

            {errors.items && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {errors.items}
              </p>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  {/* Item Name */}
                  <div className="flex-1">
                    <label className="sm:hidden block text-[11px] font-medium text-slate-600 mb-1">
                      Item Description #{index + 1}
                    </label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="e.g. Item Description / Name"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[38px]"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-full sm:w-28">
                    <label className="sm:hidden block text-[11px] font-medium text-slate-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono text-center rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[38px]"
                    />
                  </div>

                  {/* Unit Price (Rs.) */}
                  <div className="w-full sm:w-36">
                    <label className="sm:hidden block text-[11px] font-medium text-slate-600 mb-1">
                      Unit Price (Rs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none font-semibold">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full pl-9 pr-2.5 py-2 text-xs font-mono text-right rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="w-full sm:w-36 flex items-center justify-between sm:justify-end gap-2">
                    <span className="sm:hidden text-[11px] font-medium text-slate-600">Line Total:</span>
                    <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
                      {formatRupees(item.amount)}
                    </span>
                  </div>

                  {/* Delete Row Button */}
                  <div className="flex justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Remove this item"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Financial Calculations & Payment Received */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-calculator text-emerald-400"></i>
                <span>Automatic Calculation</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                Rupees (Rs.)
              </span>
            </div>

            {/* Step-by-Step Ledger Calculation */}
            <div className="space-y-3.5 text-xs text-slate-300">
              
              {/* 1. Items Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">1. Items Subtotal:</span>
                <span className="font-mono tabular-nums text-white font-semibold text-sm">
                  {formatRupees(itemsSubtotal)}
                </span>
              </div>

              {/* 2. Previous Balance */}
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
                <div>
                  <span className="text-amber-300 font-medium block">2. Previous Balance:</span>
                  <span className="text-[10px] text-slate-400">Fetched from customer</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-slate-400">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={previousBalance}
                    onChange={(e) => setPreviousBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 px-2 py-1 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-amber-300 focus:outline-none focus:border-amber-400"
                    title="Previous balance carried forward"
                  />
                </div>
              </div>

              {/* 3. Total Bill (Items Subtotal + Previous Balance) */}
              <div className="pt-2.5 border-t border-slate-800 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    3. Total Bill:
                  </span>
                  <span className="text-[10px] text-slate-400">Subtotal + Prev. Balance</span>
                </div>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                  {formatRupees(totalBill)}
                </span>
              </div>

              {/* 4. NEW - Payment Received Input */}
              <div className="pt-3 border-t-2 border-slate-800/80 bg-slate-800/40 -mx-2 px-2 py-2.5 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-money-bill-wave text-sky-400"></i>
                    <span>Payment Received (Rs.):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Cash / Online</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-semibold pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 text-sm font-mono font-bold text-right bg-slate-900 border border-sky-600/60 rounded-lg text-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                {/* Quick Payment Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentReceived(totalBill)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-colors"
                  >
                    Full Pay ({formatRupees(totalBill)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentReceived('')}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* 5. Remaining Balance (Total Bill - Payment Received) */}
              <div className="pt-3 border-t-2 border-slate-700 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Remaining Balance:
                  </span>
                  <span className="text-[10px] text-slate-400">Total Bill - Payment Received</span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xl sm:text-2xl font-black font-mono tabular-nums block ${
                      remainingBalance === 0
                        ? 'text-emerald-400'
                        : remainingBalance > 0
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {formatRupees(remainingBalance)}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase">
                    {remainingBalance === 0 && (
                      <span className="text-emerald-400 flex items-center justify-end gap-1">
                        <i className="fa-solid fa-check text-[10px]"></i> Paid in Full
                      </span>
                    )}
                    {remainingBalance > 0 && (
                      <span className="text-amber-400 flex items-center justify-end gap-1">
                        <i className="fa-solid fa-clock text-[10px]"></i> Outstanding Due
                      </span>
                    )}
                    {remainingBalance < 0 && (
                      <span className="text-sky-400">Advance / Credit</span>
                    )}
                  </span>
                </div>
              </div>

            </div>

            {/* Action Buttons: Save & Auto-Reset / Generate PDF & Auto-Reset */}
            <div className="pt-3 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                title="Save this invoice and automatically reset form for the next customer"
              >
                <i className="fa-solid fa-check text-xs"></i>
                <span>{initialInvoice ? 'Update Invoice & Auto-Reset' : 'Save Invoice & Auto-Reset'}</span>
              </button>

              <button
                type="button"
                onClick={handleGeneratePDF}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.98]"
                title="Save invoice, view printable PDF, and reset form for the next invoice"
              >
                <i className="fa-solid fa-print text-xs text-rose-400"></i>
                <span>{initialInvoice ? 'Update & Generate PDF' : 'Generate PDF & Auto-Reset'}</span>
              </button>

              {onShareWhatsApp && (
                <button
                  type="button"
                  onClick={handleShareWhatsAppDirect}
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
                  title="Share invoice on WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp text-sm"></i>
                  <span>Share on WhatsApp</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center italic pt-1">
              * Form automatically clears empty after saving or generating PDF.
            </p>
          </div>

        </div>

      </div>
    </form>
  );
};
