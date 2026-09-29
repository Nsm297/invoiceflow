import { Customer, Invoice, BusinessInfo } from '../types/invoice';

const STORAGE_KEY_CUSTOMERS = 'invoicegen_customers_v2';
const STORAGE_KEY_INVOICES = 'invoicegen_invoices_v2';
const STORAGE_KEY_BUSINESS = 'invoicegen_business_v2';

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'Al-Madina Trading & Wholesale',
  phone: '+92 300 8889900',
  address: 'Shop #14, Main Commercial Market, City Center',
  tagline: 'Dealers in Quality Rice, Oil, Grains & Wholesale Grocery',
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ahmed Ali & Sons',
    phone: '+92 300 1234567',
    openingBalance: 4500,
    previousBalance: 4500,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'cust-2',
    name: 'Rashid General Store',
    phone: '+92 321 9876543',
    openingBalance: 12500,
    previousBalance: 12500,
    createdAt: '2026-08-10T11:00:00.000Z',
    updatedAt: '2026-09-18T14:30:00.000Z',
  },
  {
    id: 'cust-3',
    name: 'Haji Bilal Khan',
    phone: '+92 345 7778899',
    openingBalance: 0,
    previousBalance: 0,
    createdAt: '2026-08-15T09:30:00.000Z',
    updatedAt: '2026-09-12T16:00:00.000Z',
  },
  {
    id: 'cust-4',
    name: 'Fatima Enterprises',
    phone: '+92 333 5551234',
    openingBalance: 3200,
    previousBalance: 3200,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-25T08:00:00.000Z',
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-sample-1',
    invoiceNumber: 'INV-2026-001',
    customerId: 'cust-1',
    customerName: 'Ahmed Ali & Sons',
    customerPhone: '+92 300 1234567',
    invoiceDate: '2026-09-22',
    items: [
      { id: 'it-1', name: 'Super Basmati Rice (50kg Bag)', quantity: 4, unitPrice: 12500, amount: 50000 },
      { id: 'it-2', name: 'Refined Cooking Oil (16 Litre Tin)', quantity: 2, unitPrice: 7800, amount: 15600 },
      { id: 'it-3', name: 'Fine Wheat Flour (20kg Bag)', quantity: 5, unitPrice: 2200, amount: 11000 },
    ],
    subtotal: 76600,
    previousBalance: 4500,
    totalBill: 81100,
    paymentReceived: 75000,
    remainingBalance: 6100,
    grandTotal: 81100,
    createdAt: '2026-09-22T10:30:00.000Z',
  },
  {
    id: 'inv-sample-2',
    invoiceNumber: 'INV-2026-002',
    customerId: 'cust-2',
    customerName: 'Rashid General Store',
    customerPhone: '+92 321 9876543',
    invoiceDate: '2026-09-15',
    items: [
      { id: 'it-4', name: 'Premium Tea Blend (5kg Box)', quantity: 6, unitPrice: 5400, amount: 32400 },
      { id: 'it-5', name: 'White Sugar (50kg Bag)', quantity: 3, unitPrice: 6800, amount: 20400 },
    ],
    subtotal: 52800,
    previousBalance: 12500,
    totalBill: 65300,
    paymentReceived: 50000,
    remainingBalance: 15300,
    grandTotal: 65300,
    createdAt: '2026-09-15T14:15:00.000Z',
  },
  {
    id: 'inv-sample-3',
    invoiceNumber: 'INV-2026-003',
    customerId: 'cust-3',
    customerName: 'Haji Bilal Khan',
    customerPhone: '+92 345 7778899',
    invoiceDate: '2026-08-28',
    items: [
      { id: 'it-6', name: 'Packed Spices Assorted (Carton)', quantity: 10, unitPrice: 1850, amount: 18500 },
      { id: 'it-7', name: 'Iodized Salt (1kg x 24pkts)', quantity: 5, unitPrice: 960, amount: 4800 },
    ],
    subtotal: 23300,
    previousBalance: 0,
    totalBill: 23300,
    paymentReceived: 23300,
    remainingBalance: 0,
    grandTotal: 23300,
    createdAt: '2026-08-28T11:00:00.000Z',
  },
  {
    id: 'inv-sample-4',
    invoiceNumber: 'INV-2026-004',
    customerId: 'cust-4',
    customerName: 'Fatima Enterprises',
    customerPhone: '+92 333 5551234',
    invoiceDate: '2026-08-10',
    items: [
      { id: 'it-8', name: 'Refined Cooking Oil (16 Litre Tin)', quantity: 3, unitPrice: 7800, amount: 23400 },
      { id: 'it-9', name: 'Super Basmati Rice (50kg Bag)', quantity: 2, unitPrice: 12500, amount: 25000 },
    ],
    subtotal: 48400,
    previousBalance: 3200,
    totalBill: 51600,
    paymentReceived: 40000,
    remainingBalance: 11600,
    grandTotal: 51600,
    createdAt: '2026-08-10T09:40:00.000Z',
  },
  {
    id: 'inv-sample-5',
    invoiceNumber: 'INV-2026-005',
    customerId: 'cust-1',
    customerName: 'Ahmed Ali & Sons',
    customerPhone: '+92 300 1234567',
    invoiceDate: '2026-07-18',
    items: [
      { id: 'it-10', name: 'Dry Pulses Mixed (50kg Bag)', quantity: 2, unitPrice: 14200, amount: 28400 },
    ],
    subtotal: 28400,
    previousBalance: 1500,
    totalBill: 29900,
    paymentReceived: 29900,
    remainingBalance: 0,
    grandTotal: 29900,
    createdAt: '2026-07-18T16:00:00.000Z',
  },
];

/**
 * Calculates a customer's dynamic running balance:
 * Running Balance = Opening Balance + (Sum of all that customer's previous invoice Subtotals / New Bills) - (Sum of all Payments Received)
 */
export const getCustomerRunningBalance = (
  customer: Customer | { id?: string; name?: string; openingBalance?: number; previousBalance?: number },
  allInvoices: Invoice[],
  excludeInvoiceId?: string
): number => {
  const opening = Number(customer.openingBalance ?? customer.previousBalance ?? 0);
  const custId = customer.id;
  const custName = customer.name ? customer.name.trim().toLowerCase() : '';

  const relevantInvoices = allInvoices.filter((inv) => {
    if (excludeInvoiceId && inv.id === excludeInvoiceId) return false;
    if (custId && inv.customerId && inv.customerId === custId) return true;
    if (custName && inv.customerName && inv.customerName.trim().toLowerCase() === custName) return true;
    return false;
  });

  const totalSales = relevantInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  const totalPaid = relevantInvoices.reduce((sum, inv) => sum + (Number(inv.paymentReceived) || 0), 0);

  return opening + totalSales - totalPaid;
};

// Customer Storage Helpers
export const getStoredCustomers = (): Customer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_CUSTOMERS;

    return parsed.map((c: any) => ({
      ...c,
      openingBalance: Number(c.openingBalance ?? c.previousBalance ?? 0),
      previousBalance: Number(c.previousBalance ?? c.openingBalance ?? 0),
    }));
  } catch (err) {
    console.error('Failed to load customers:', err);
    return INITIAL_CUSTOMERS;
  }
};

export const saveStoredCustomers = (customers: Customer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save customers:', err);
  }
};

export const saveCustomer = (customer: Customer): Customer[] => {
  const current = getStoredCustomers();
  const index = current.findIndex((c) => c.id === customer.id);
  const opBal = Number(customer.openingBalance ?? customer.previousBalance ?? 0);

  let updated: Customer[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...customer,
      openingBalance: opBal,
      previousBalance: opBal,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated = [
      {
        ...customer,
        id: customer.id || `cust-${Date.now()}`,
        openingBalance: opBal,
        previousBalance: opBal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ];
  }
  saveStoredCustomers(updated);
  return updated;
};

export const deleteCustomer = (id: string): Customer[] => {
  const current = getStoredCustomers();
  const updated = current.filter((c) => c.id !== id);
  saveStoredCustomers(updated);
  return updated;
};

// Invoice Storage Helpers
export const getStoredInvoices = (): Invoice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_INVOICES;

    // Sanitize invoices
    return parsed.map((inv: any) => {
      const subtotal = Number(inv.subtotal) || 0;
      const prevBal = Number(inv.previousBalance) || 0;
      const totalBill = Number(inv.totalBill ?? (inv.grandTotal || subtotal + prevBal));
      const paymentReceived = Number(inv.paymentReceived || 0);
      const remainingBalance = Number(inv.remainingBalance ?? (totalBill - paymentReceived));
      const grandTotal = Number(inv.grandTotal ?? totalBill);

      return {
        ...inv,
        subtotal,
        previousBalance: prevBal,
        totalBill,
        paymentReceived,
        remainingBalance,
        grandTotal,
      };
    });
  } catch (err) {
    console.error('Failed to load invoices:', err);
    return INITIAL_INVOICES;
  }
};

export const saveStoredInvoices = (invoices: Invoice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  } catch (err) {
    console.error('Failed to save invoices:', err);
  }
};

export const saveInvoice = (invoice: Invoice): Invoice[] => {
  const current = getStoredInvoices();
  const index = current.findIndex((inv) => inv.id === invoice.id);
  let updated: Invoice[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    updated = [
      {
        ...invoice,
        id: invoice.id || `inv-${Date.now()}`,
        createdAt: invoice.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ];
  }
  saveStoredInvoices(updated);
  return updated;
};

export const deleteInvoice = (id: string): Invoice[] => {
  const current = getStoredInvoices();
  const updated = current.filter((inv) => inv.id !== id);
  saveStoredInvoices(updated);
  return updated;
};

// Business Info
export const getStoredBusinessInfo = (): BusinessInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUSINESS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BUSINESS, JSON.stringify(DEFAULT_BUSINESS_INFO));
      return DEFAULT_BUSINESS_INFO;
    }
    return { ...DEFAULT_BUSINESS_INFO, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUSINESS_INFO;
  }
};

export const saveStoredBusinessInfo = (info: BusinessInfo): void => {
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESS, JSON.stringify(info));
  } catch (err) {
    console.error('Failed to save business info:', err);
  }
};

export const resetAllDemoData = () => {
  localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
  localStorage.setItem(STORAGE_KEY_BUSINESS, JSON.stringify(DEFAULT_BUSINESS_INFO));
  return {
    customers: INITIAL_CUSTOMERS,
    invoices: INITIAL_INVOICES,
    businessInfo: DEFAULT_BUSINESS_INFO,
  };
};
