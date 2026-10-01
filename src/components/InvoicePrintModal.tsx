import React, { useState } from 'react';
import { Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate } from '../utils/formatters';
import {
  downloadInvoicePDF,
  downloadInvoiceImage,
  shareInvoiceViaWhatsAppImage,
} from '../utils/pdfGenerator';
import { TemplateSelector } from './TemplateSelector';
import { useJpgTemplate } from '../hooks/useJpgTemplate';
import { JpgTemplateId } from '../types/template';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  businessInfo: BusinessInfo;
  isOpen: boolean;
  onClose: () => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  businessInfo,
  isOpen,
  onClose,
  onShareWhatsApp,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingJPG, setIsGeneratingJPG] = useState(false);
  const [isSharingWA, setIsSharingWA] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useJpgTemplate();

  if (!isOpen || !invoice) return null;

  const totalBill = invoice.totalBill ?? (invoice.grandTotal || (invoice.subtotal + (invoice.previousBalance || 0)));
  const paymentReceived = invoice.paymentReceived || 0;
  const remainingBalance = invoice.remainingBalance ?? (totalBill - paymentReceived);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJPG = async () => {
    try {
      setIsGeneratingJPG(true);
      const printElement = document.getElementById('invoice-render-area') || document.getElementById('printable-invoice');
      await downloadInvoiceImage(invoice, businessInfo, printElement);
    } catch (err: any) {
      console.error('Failed to generate JPG image:', err);
    } finally {
      setIsGeneratingJPG(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const printElement = document.getElementById('invoice-render-area') || document.getElementById('printable-invoice');
      await downloadInvoicePDF(invoice, businessInfo, printElement);
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (onShareWhatsApp) {
      onShareWhatsApp(invoice);
      return;
    }
    try {
      setIsSharingWA(true);
      const printElement = document.getElementById('invoice-render-area') || document.getElementById('printable-invoice');
      await shareInvoiceViaWhatsAppImage(invoice, businessInfo, printElement);
    } catch (err: any) {
      console.error('Failed to share image on WhatsApp:', err);
    } finally {
      setIsSharingWA(false);
    }
  };

  const handleCopySummary = () => {
    const text = `
INVOICE: #${invoice.invoiceNumber}
Date: ${formatDate(invoice.invoiceDate)}
Customer: ${invoice.customerName} (${invoice.customerPhone || 'N/A'})

FROM: ${businessInfo.name}
Phone: ${businessInfo.phone}
Address: ${businessInfo.address}

ITEMS:
${invoice.items.map((it) => `- ${it.name} (Qty: ${it.quantity} x ${formatRupees(it.unitPrice)}): ${formatRupees(it.amount)}`).join('\n')}

Items Subtotal: ${formatRupees(invoice.subtotal)}
Previous Balance: ${formatRupees(invoice.previousBalance)}
TOTAL BILL: ${formatRupees(totalBill)}
Payment Received: ${formatRupees(paymentReceived)}
REMAINING BALANCE: ${formatRupees(remainingBalance)}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto border border-slate-200">
        
        {/* Top Control Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-slate-900 text-white shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Invoice Export & Print
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct JPG Image Download Button */}
            <button
              type="button"
              onClick={handleDownloadJPG}
              disabled={isGeneratingJPG}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download invoice directly as a high-quality JPG image"
            >
              {isGeneratingJPG ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
              ) : (
                <i className="fa-solid fa-image text-xs"></i>
              )}
              <span>{isGeneratingJPG ? 'Generating...' : 'Export JPG'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWA}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Share invoice image directly on WhatsApp"
            >
              {isSharingWA ? (
                <i className="fa-solid fa-spinner fa-spin text-sm"></i>
              ) : (
                <i className="fa-brands fa-whatsapp text-sm"></i>
              )}
              <span>{isSharingWA ? 'Preparing...' : 'WhatsApp'}</span>
            </button>

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download single-page A4 PDF file"
            >
              {isGeneratingPDF ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
              ) : (
                <i className="fa-solid fa-file-pdf text-xs"></i>
              )}
              <span>PDF</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Print document via system print dialog"
            >
              <i className="fa-solid fa-print text-xs"></i>
              <span>Print</span>
            </button>

            {/* Copy Summary Button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Copy text summary"
            >
              <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'} text-xs`}></i>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Template Selector Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">JPG Export Template:</span>
            <span className="text-[11px] text-slate-500">Pick layout style before downloading</span>
          </div>
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            variant="pills"
          />
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0 flex-1">
          <div
            id="invoice-render-area"
            data-template={selectedTemplate}
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
            }}
            className={`max-w-2xl mx-auto rounded-xl shadow-xs transition-all ${
              selectedTemplate === 'classic'
                ? 'p-8 sm:p-10 border-2 border-slate-300 font-sans'
                : selectedTemplate === 'modern'
                ? 'p-8 sm:p-10 border border-slate-200 font-sans'
                : selectedTemplate === 'compact'
                ? 'p-5 sm:p-6 border-2 border-dashed border-slate-400 font-mono text-xs'
                : 'p-8 sm:p-10 border-2 border-emerald-800 font-sans'
            }`}
          >
            {/* Header Section by Template */}
            {selectedTemplate === 'elegant' ? (
              <div className="bg-emerald-950 text-white -mx-8 sm:-mx-10 -mt-8 sm:-mt-10 p-6 sm:p-8 rounded-t-lg mb-6 border-b-4 border-emerald-600">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-100 mb-2">
                      Verified Store Invoice
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {businessInfo.name}
                    </h1>
                    {businessInfo.tagline && (
                      <p className="text-xs text-emerald-200 font-medium italic mt-0.5">
                        {businessInfo.tagline}
                      </p>
                    )}
                    <div className="text-xs text-emerald-100 mt-2 space-y-0.5">
                      {businessInfo.phone && <p>📞 Phone: {businessInfo.phone}</p>}
                      {businessInfo.address && <p>📍 {businessInfo.address}</p>}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-3xl font-black tracking-tight text-white">
                      INVOICE
                    </div>
                    <div className="font-mono text-base font-black text-emerald-300 mt-1">
                      #{invoice.invoiceNumber}
                    </div>
                    <div className="text-xs text-emerald-200 mt-1">
                      Date: <span className="font-bold text-white">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedTemplate === 'classic' ? (
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-blue-900 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
                    {businessInfo.name}
                  </h1>
                  {businessInfo.tagline && (
                    <p className="text-xs font-semibold text-blue-700 italic mt-0.5">
                      {businessInfo.tagline}
                    </p>
                  )}
                  <div className="text-xs text-slate-700 mt-1.5 space-y-0.5">
                    {businessInfo.phone && <p className="font-medium">Phone: {businessInfo.phone}</p>}
                    {businessInfo.address && <p>{businessInfo.address}</p>}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-block bg-blue-900 text-white font-black text-xs px-3 py-1 rounded tracking-wider uppercase mb-1">
                    Tax / Retail Invoice
                  </div>
                  <div className="font-mono text-lg font-black text-blue-950">
                    #{invoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    Date: <span className="font-bold text-slate-900">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                </div>
              </div>
            ) : selectedTemplate === 'compact' ? (
              <div className="border-b-2 border-dashed border-slate-400 pb-3 mb-4 text-center">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {businessInfo.name}
                </h1>
                {businessInfo.tagline && (
                  <p className="text-[10px] text-slate-600 italic">{businessInfo.tagline}</p>
                )}
                <p className="text-[11px] text-slate-700 mt-0.5">
                  Tel: {businessInfo.phone || 'N/A'} · {businessInfo.address}
                </p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-slate-300 text-xs">
                  <span>BILL #{invoice.invoiceNumber}</span>
                  <span>{formatDate(invoice.invoiceDate)}</span>
                </div>
              </div>
            ) : (
              /* Modern Minimal */
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {businessInfo.name}
                  </h1>
                  {businessInfo.tagline && (
                    <p className="text-xs text-slate-500 mt-0.5">{businessInfo.tagline}</p>
                  )}
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    <p>Phone: {businessInfo.phone}</p>
                    <p>Address: {businessInfo.address}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-2xl font-light text-slate-400 uppercase tracking-widest">
                    Invoice
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                    #{invoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(invoice.invoiceDate)}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Box */}
            <div
              className={`mb-6 p-4 rounded-xl ${
                selectedTemplate === 'elegant'
                  ? 'bg-emerald-50/70 border border-emerald-200'
                  : selectedTemplate === 'classic'
                  ? 'bg-blue-50/60 border border-blue-200'
                  : selectedTemplate === 'compact'
                  ? 'bg-slate-50 border border-dashed border-slate-400 p-2.5'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500 mb-0.5">
                Billed To Customer:
              </span>
              <p className="text-base font-bold text-slate-900">{invoice.customerName}</p>
              {invoice.customerPhone && (
                <p className="text-xs text-slate-700 font-mono mt-0.5 font-medium">
                  Phone: {invoice.customerPhone}
                </p>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`uppercase tracking-wider font-bold ${
                      selectedTemplate === 'elegant'
                        ? 'bg-emerald-900 text-white text-[11px]'
                        : selectedTemplate === 'classic'
                        ? 'bg-blue-900 text-white text-[11px]'
                        : selectedTemplate === 'compact'
                        ? 'border-b border-t border-dashed border-slate-700 text-slate-900 text-[10px]'
                        : 'border-b border-slate-300 text-slate-700 text-[11px] bg-slate-100'
                    }`}
                  >
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${selectedTemplate === 'compact' ? 'divide-dashed divide-slate-300' : 'divide-slate-200'}`}>
                  {invoice.items.map((it, idx) => (
                    <tr
                      key={it.id || idx}
                      className={idx % 2 === 1 && selectedTemplate !== 'compact' ? 'bg-slate-50/60' : 'bg-white'}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{it.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatRupees(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">{formatRupees(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-2 pb-6 border-b border-slate-200">
              <div
                className={`w-full sm:w-80 p-4 rounded-xl space-y-2 text-xs ${
                  selectedTemplate === 'elegant'
                    ? 'bg-emerald-50/80 border-2 border-emerald-300'
                    : selectedTemplate === 'classic'
                    ? 'bg-blue-50/80 border-2 border-blue-300'
                    : selectedTemplate === 'compact'
                    ? 'bg-slate-50 border border-dashed border-slate-400 p-3'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                {/* Items Subtotal */}
                <div className="flex justify-between text-slate-700">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupees(invoice.subtotal)}</span>
                </div>

                {/* Previous Balance */}
                <div className="flex justify-between text-slate-700">
                  <span>Previous Balance:</span>
                  <span className="font-mono font-bold text-amber-900">{formatRupees(invoice.previousBalance)}</span>
                </div>

                {/* Total Bill */}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 text-sm font-bold text-slate-950">
                  <span>Total Bill:</span>
                  <span className="text-base font-mono font-black">{formatRupees(totalBill)}</span>
                </div>

                {/* Payment Received */}
                <div className="flex justify-between pt-0.5 text-sky-900 font-bold">
                  <span>Payment Received:</span>
                  <span className="font-mono">{formatRupees(paymentReceived)}</span>
                </div>

                {/* Remaining Balance */}
                <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-sm font-bold">
                  <span>Remaining Balance:</span>
                  <span
                    className={`text-lg font-mono font-black ${
                      remainingBalance === 0 ? 'text-emerald-800' : remainingBalance > 0 ? 'text-amber-900' : 'text-sky-900'
                    }`}
                  >
                    {formatRupees(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-600 font-medium">
              Thank you for your business! For inquiries, contact {businessInfo.phone || 'us'}.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

