import React from 'react';
import { YearlyStatement } from './YearlyStatement';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { downloadAsJpg, exportToJpg } from '../utils/exportToJpg';

export interface YearlyReportProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
}

/**
 * YearlyReport Component
 * Wraps YearlyStatement and provides exportToJpg functionality
 */
export const YearlyReport: React.FC<YearlyReportProps> = ({
  invoices,
  customers = [],
  businessInfo,
}) => {
  return (
    <YearlyStatement
      invoices={invoices}
      customers={customers}
      businessInfo={businessInfo}
    />
  );
};

export { downloadAsJpg, exportToJpg };
export default YearlyReport;
