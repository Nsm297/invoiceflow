import React, { useState } from 'react';
import { Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate } from '../utils/formatters';
import {
  downloadInvoicePDF,
  downloadInvoiceImage,
  shareInvoiceViaWhatsAppImage,
} from '../utils/pdfGenerator';

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
      // Fallback to browser print
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

  const handleDownloadHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoice.invoiceNumber} - ${invoice.customerName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; background: #fff; padding: 30px; max-width: 800px; margin: 0 auto; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0f172a; margin-bottom: 20px; }
    .store-name { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .store-info { font-size: 12px; color: #475569; line-height: 1.4; }
    .inv-title { font-size: 26px; font-weight: 800; text-align: right; color: #0f172a; letter-spacing: -0.5px; }
    .inv-meta { font-size: 13px; text-align: right; color: #334155; margin-top: 4px; }
    .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; }
    .cust-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .cust-name { font-size: 16px; font-weight: 700; color: #0f172a; }
    .cust-phone { font-size: 13px; color: #334155; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #334155; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: 700; }
    th.text-right { text-align: right; }
    td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    td.text-right { text-align: right; font-family: monospace; font-size: 13px; }
    .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-card { width: 340px; }
    .total-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .total-line span:last-child { font-family: monospace; font-weight: 600; }
    .total-line.bill { border-top: 1px solid #cbd5e1; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 800; color: #0f172a; }
    .total-line.paid { color: #0369a1; font-weight: 700; }
    .total-line.remaining { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 17px; font-weight: 800; color: #047857; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-name">${businessInfo.name}</div>
      ${businessInfo.tagline ? `<div style="font-size: 11px; color: #047857; font-style: italic; margin-bottom: 4px;">${businessInfo.tagline}</div>` : ''}
      <div class="store-info">
        <div>Phone: ${businessInfo.phone}</div>
        <div>Address: ${businessInfo.address}</div>
      </div>
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-meta">
        <div><strong>#${invoice.invoiceNumber}</strong></div>
        <div>Date: ${formatDate(invoice.invoiceDate)}</div>
      </div>
    </div>
  </div>

  <div class="customer-box">
    <div class="cust-label">Billed Customer</div>
    <div class="cust-name">${invoice.customerName}</div>
    ${invoice.customerPhone ? `<div class="cust-phone">Phone: ${invoice.customerPhone}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Item Name</th>
        <th class="text-right" style="width: 15%;">Qty</th>
        <th class="text-right" style="width: 18%;">Unit Price</th>
        <th class="text-right" style="width: 17%;">Total (Rs.)</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (it) => `
        <tr>
          <td><strong>${it.name}</strong></td>
          <td class="text-right">${it.quantity}</td>
          <td class="text-right">${formatRupees(it.unitPrice)}</td>
          <td class="text-right">${formatRupees(it.amount)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals-wrapper">
    <div class="totals-card">
      <div class="total-line">
        <span>Items Subtotal:</span>
        <span>${formatRupees(invoice.subtotal)}</span>
      </div>
      <div class="total-line">
        <span>Previous Balance:</span>
        <span style="color: #b45309;">${formatRupees(invoice.previousBalance)}</span>
      </div>
      <div class="total-line bill">
        <span>Total Bill:</span>
        <span>${formatRupees(totalBill)}</span>
      </div>
      <div class="total-line paid">
        <span>Payment Received:</span>
        <span>${formatRupees(paymentReceived)}</span>
      </div>
      <div class="total-line remaining">
        <span>Remaining Balance:</span>
        <span>${formatRupees(remainingBalance)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    Thank you for your business! For inquiries, contact ${businessInfo.phone}.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber}_${invoice.customerName.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto border border-slate-200">
        
        {/* Top Control Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Invoice Print / PDF
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharingWA}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors active:scale-[0.98]"
              title="Share invoice image directly on WhatsApp"
            >
              {isSharingWA ? (
                <i className="fa-solid fa-spinner fa-spin text-sm"></i>
              ) : (
                <i className="fa-brands fa-whatsapp text-sm"></i>
              )}
              <span>{isSharingWA ? 'Preparing...' : 'WhatsApp'}</span>
            </button>

            {/* Direct JPG Image Download Button */}
            <button
              onClick={handleDownloadJPG}
              disabled={isGeneratingJPG}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors active:scale-[0.98]"
              title="Download invoice directly as a high-quality JPG image"
            >
              {isGeneratingJPG ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
              ) : (
                <i className="fa-solid fa-image text-xs"></i>
              )}
              <span>{isGeneratingJPG ? 'Generating...' : 'Download Image (JPG)'}</span>
            </button>

            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors active:scale-[0.98]"
              title="Download single-page A4 PDF file"
            >
              {isGeneratingPDF ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
              ) : (
                <i className="fa-solid fa-file-pdf text-xs"></i>
              )}
              <span>{isGeneratingPDF ? 'Generating...' : 'PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Print document via system print dialog"
            >
              <i className="fa-solid fa-print text-xs"></i>
              <span>Print</span>
            </button>

            {/* Download Standalone HTML Button */}
            <button
              onClick={handleDownloadHTML}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Download standalone HTML file"
            >
              <i className="fa-solid fa-file-arrow-down text-xs"></i>
              <span>HTML File</span>
            </button>

            {/* Copy Summary Button */}
            <button
              onClick={handleCopySummary}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Copy text summary"
            >
              <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'} text-xs`}></i>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document */}
        <div className="overflow-y-auto p-5 sm:p-10 bg-slate-100 print:bg-white print:p-0">
          <div
            id="invoice-render-area"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              borderColor: '#e2e8f0',
            }}
            className="print-only-container max-w-2xl mx-auto p-8 sm:p-10 rounded-xl shadow-xs border print:shadow-none print:border-none print:p-0"
          >
            {/* Header */}
            <div
              style={{ borderBottomColor: '#0f172a' }}
              className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2"
            >
              <div>
                <h1 style={{ color: '#0f172a' }} className="text-2xl font-black tracking-tight">
                  {businessInfo.name}
                </h1>
                {businessInfo.tagline && (
                  <p style={{ color: '#047857' }} className="text-xs font-medium italic mt-0.5">
                    {businessInfo.tagline}
                  </p>
                )}
                <div style={{ color: '#475569' }} className="text-xs mt-1 space-y-0.5">
                  <p>Phone: {businessInfo.phone}</p>
                  <p>Address: {businessInfo.address}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div style={{ color: '#0f172a' }} className="text-3xl font-extrabold tracking-tight">
                  INVOICE
                </div>
                <div style={{ color: '#0f172a' }} className="font-mono text-sm font-bold mt-1">
                  #{invoice.invoiceNumber}
                </div>
                <div style={{ color: '#475569' }} className="text-xs mt-0.5">
                  Date: <span style={{ color: '#0f172a' }} className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                </div>
              </div>
            </div>

            {/* Customer Box */}
            <div
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
              className="my-6 p-4 rounded-lg border"
            >
              <span style={{ color: '#64748b' }} className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                Billed Customer
              </span>
              <p style={{ color: '#0f172a' }} className="text-base font-bold">{invoice.customerName}</p>
              {invoice.customerPhone && (
                <p style={{ color: '#475569' }} className="text-xs mt-0.5">Phone: {invoice.customerPhone}</p>
              )}
            </div>

            {/* Items Table */}
            <div className="my-6 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderBottomColor: '#0f172a',
                    }}
                    className="border-b-2 text-[11px] uppercase tracking-wider"
                  >
                    <th className="py-2.5 px-3 font-bold">Item Description</th>
                    <th className="py-2.5 px-3 text-right font-bold w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right font-bold w-28">Unit Price</th>
                    <th className="py-2.5 px-3 text-right font-bold w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it, idx) => (
                    <tr
                      key={it.id || idx}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                      }}
                    >
                      <td style={{ color: '#1e293b' }} className="py-3 px-3 font-semibold">{it.name}</td>
                      <td style={{ color: '#334155' }} className="py-3 px-3 text-right font-mono tabular-nums">
                        {it.quantity}
                      </td>
                      <td style={{ color: '#334155' }} className="py-3 px-3 text-right font-mono tabular-nums">
                        {formatRupees(it.unitPrice)}
                      </td>
                      <td style={{ color: '#0f172a' }} className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                        {formatRupees(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div style={{ borderBottomColor: '#e2e8f0' }} className="flex justify-end pt-2 pb-6 border-b">
              <div
                style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                className="w-full sm:w-80 p-4 rounded-lg border space-y-2 text-xs"
              >
                {/* Items Subtotal */}
                <div style={{ color: '#475569' }} className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span style={{ color: '#0f172a' }} className="font-mono tabular-nums font-bold">
                    {formatRupees(invoice.subtotal)}
                  </span>
                </div>

                {/* Previous Balance */}
                <div style={{ color: '#475569' }} className="flex justify-between">
                  <span>Previous Balance:</span>
                  <span style={{ color: '#b45309' }} className="font-mono tabular-nums font-semibold">
                    {formatRupees(invoice.previousBalance)}
                  </span>
                </div>

                {/* Total Bill */}
                <div
                  style={{ color: '#0f172a', borderTopColor: '#cbd5e1' }}
                  className="flex justify-between items-baseline pt-2 border-t text-sm font-bold"
                >
                  <span>Total Bill:</span>
                  <span style={{ color: '#0f172a' }} className="text-base font-mono tabular-nums font-extrabold">
                    {formatRupees(totalBill)}
                  </span>
                </div>

                {/* Payment Received */}
                <div style={{ color: '#0369a1' }} className="flex justify-between pt-0.5">
                  <span className="font-semibold">Payment Received:</span>
                  <span className="font-mono tabular-nums font-bold">
                    {formatRupees(paymentReceived)}
                  </span>
                </div>

                {/* Remaining Balance */}
                <div
                  style={{ color: '#0f172a', borderTopColor: '#0f172a' }}
                  className="flex justify-between items-baseline pt-2 border-t-2 text-sm font-bold"
                >
                  <span>Remaining Balance:</span>
                  <span
                    style={{
                      color: remainingBalance === 0 ? '#047857' : remainingBalance > 0 ? '#b45309' : '#0369a1',
                    }}
                    className="text-lg font-mono tabular-nums font-extrabold"
                  >
                    {formatRupees(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ color: '#64748b' }} className="mt-6 pt-4 text-center text-[11px]">
              Thank you for your business! Please keep this invoice for your records.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
