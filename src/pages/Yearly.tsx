import React from 'react';
import { YearlyStatement } from '../components/YearlyStatement';
import { YearlyReport } from '../components/YearlyReport';
import { Invoice, Customer, BusinessInfo } from '../types/invoice';
import { downloadAsJpg, exportToJpg } from '../utils/exportToJpg';

export interface YearlyPageProps {
  invoices: Invoice[];
  customers?: Customer[];
  businessInfo?: BusinessInfo;
}

export const Yearly: React.FC<YearlyPageProps> = (props) => {
  return <YearlyStatement {...props} />;
};

export { YearlyStatement, YearlyReport, downloadAsJpg, exportToJpg };
export default Yearly;
