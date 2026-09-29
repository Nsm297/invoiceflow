export interface Customer {
  id: string;
  name: string;
  phone: string;
  openingBalance: number; // in Rs. - set ONCE as initial starting balance
  previousBalance?: number; // legacy fallback
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // in Rs.
  amount: number; // quantity * unitPrice
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  invoiceDate: string; // YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number; // Sum of (Qty × Unit Price)
  previousBalance: number; // from customer
  totalBill: number; // Items Subtotal + Previous Balance
  paymentReceived: number; // Amount paid by client in cash/online
  remainingBalance: number; // Total Bill - Payment Received
  grandTotal: number; // Equals totalBill for backwards compatibility
  createdAt: string;
  updatedAt?: string;
}

export type TabType = 'store' | 'create' | 'customers' | 'history' | 'monthly' | 'yearly';

export interface BusinessInfo {
  name: string;
  phone: string;
  address: string;
  tagline?: string;
}

export interface SecurityConfig {
  pinEnabled: boolean;
  pin: string; // 4-digit PIN
  biometricEnabled: boolean;
  credentialId?: string;
  autoLockOnIdle?: boolean;
}
