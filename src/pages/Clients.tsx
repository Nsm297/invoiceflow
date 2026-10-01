import React from 'react';
import { CustomerModule } from '../components/CustomerModule';
import { CustomerKhataModal } from '../components/CustomerKhataModal';
import { CustomerLedger } from '../components/CustomerLedger';
import { Customer, Invoice, BusinessInfo } from '../types/invoice';
import { downloadAsJpg, exportToJpg } from '../utils/exportToJpg';

export interface ClientsPageProps {
  customers: Customer[];
  invoices?: Invoice[];
  businessInfo?: BusinessInfo;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onCreateInvoiceForCustomer: (customer: Customer) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const Clients: React.FC<ClientsPageProps> = (props) => {
  return <CustomerModule {...props} />;
};

export { CustomerKhataModal, CustomerLedger, downloadAsJpg, exportToJpg };
export default Clients;
