import React from 'react';
import { CustomerKhataModal } from './CustomerKhataModal';
import { Customer, Invoice, BusinessInfo } from '../types/invoice';
import { downloadAsJpg, exportToJpg } from '../utils/exportToJpg';

export interface CustomerLedgerProps {
  customer: Customer;
  invoices: Invoice[];
  businessInfo: BusinessInfo;
  onClose?: () => void;
  onCreateInvoice?: (customer: Customer) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

/**
 * CustomerLedger Component
 * Wraps CustomerKhataModal and provides direct JPG export function
 */
export const CustomerLedger: React.FC<CustomerLedgerProps> = (props) => {
  return (
    <CustomerKhataModal
      customer={props.customer}
      invoices={props.invoices}
      businessInfo={props.businessInfo}
      onClose={props.onClose || (() => {})}
      onCreateInvoice={props.onCreateInvoice || (() => {})}
      onViewInvoice={props.onViewInvoice}
    />
  );
};

export { downloadAsJpg, exportToJpg };
export default CustomerLedger;
