import React from 'react';
import { MonthlyStatement } from './MonthlyStatement';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { downloadAsJpg, exportToJpg } from '../utils/exportToJpg';

export interface MonthlyReportProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
  onPreviewInvoice?: (invoice: Invoice) => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
}

/**
 * MonthlyReport Component
 * Wraps MonthlyStatement and provides exportToJpg functionality
 */
export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  invoices,
  customers = [],
  businessInfo,
  onPreviewInvoice = () => {},
  onShareWhatsApp,
}) => {
  return (
    <MonthlyStatement
      invoices={invoices}
      customers={customers}
      businessInfo={businessInfo}
      onPreviewInvoice={onPreviewInvoice}
      onShareWhatsApp={onShareWhatsApp}
    />
  );
};

export { downloadAsJpg, exportToJpg };
export default MonthlyReport;
