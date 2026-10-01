import React from 'react';
import { MonthlyStatement } from '../components/MonthlyStatement';
import { MonthlyReport } from '../components/MonthlyReport';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { downloadAsJpg, exportToJpg } from '../utils/exportToJpg';

export interface MonthlyPageProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
  onPreviewInvoice?: (invoice: Invoice) => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
}

export const Monthly: React.FC<MonthlyPageProps> = (props) => {
  return (
    <MonthlyStatement
      invoices={props.invoices}
      customers={props.customers}
      businessInfo={props.businessInfo}
      onPreviewInvoice={props.onPreviewInvoice || (() => {})}
      onShareWhatsApp={props.onShareWhatsApp}
    />
  );
};

export { MonthlyStatement, MonthlyReport, downloadAsJpg, exportToJpg };
export default Monthly;
