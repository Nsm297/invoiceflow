import { Customer, Invoice, BusinessInfo } from '../types/invoice';

const STORAGE_KEY_CUSTOMERS = 'invoicegen_customers_v2';
const STORAGE_KEY_INVOICES = 'invoicegen_invoices_v2';
const STORAGE_KEY_BUSINESS = 'invoicegen_business_v2';

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'InvoiceFlow Store',
  phone: '',
  address: '',
  tagline: '',
};

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

/**
 * Clears transient session and cached invoice/customer data on logout,
 * while preserving permanent user security configuration (pwa_pin_*, biometrics).
 */
export const clearAllUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
    localStorage.removeItem(STORAGE_KEY_INVOICES);
    localStorage.removeItem(STORAGE_KEY_BUSINESS);
    // Security PIN and biometrics (pwa_pin_*) are permanently preserved
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('pwa_unlocked');
      sessionStorage.removeItem('pwa_guest_mode');
    }
  } catch (err) {
    console.error('Error clearing user data:', err);
  }
};

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
