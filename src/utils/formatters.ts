import { Invoice, BusinessInfo } from '../types/invoice';

export const formatRupees = (amount: number, showDecimals: boolean = true): string => {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${isNegative ? '-' : ''}Rs. ${formatted}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const getNextInvoiceNumber = (existingInvoices: Invoice[], prefix: string = 'INV'): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${prefix}-${currentYear}-`;

  let maxSeq = 0;
  for (const inv of existingInvoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(yearPrefix)) {
      const seqStr = inv.invoiceNumber.replace(yearPrefix, '');
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${yearPrefix}${nextSeq}`;
};

export const exportInvoicesToCSV = (invoices: Invoice[]): void => {
  if (!invoices.length) return;

  const headers = [
    'Invoice Number',
    'Customer Name',
    'Customer Phone',
    'Invoice Date',
    'Items Count',
    'Items Subtotal (Rs.)',
    'Previous Balance (Rs.)',
    'Total Bill (Rs.)',
    'Payment Received (Rs.)',
    'Remaining Balance (Rs.)',
  ];

  const rows = invoices.map((inv) => {
    const totalBill = inv.totalBill ?? (inv.grandTotal || (inv.subtotal + (inv.previousBalance || 0)));
    const paymentReceived = inv.paymentReceived || 0;
    const remainingBalance = inv.remainingBalance ?? (totalBill - paymentReceived);

    return [
      `"${inv.invoiceNumber || ''}"`,
      `"${(inv.customerName || '').replace(/"/g, '""')}"`,
      `"${(inv.customerPhone || '').replace(/"/g, '""')}"`,
      inv.invoiceDate,
      inv.items?.length || 0,
      inv.subtotal.toFixed(2),
      inv.previousBalance.toFixed(2),
      totalBill.toFixed(2),
      paymentReceived.toFixed(2),
      remainingBalance.toFixed(2),
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Invoices_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Cleans phone number to international WhatsApp format (e.g. 923001234567)
 */
export const cleanPhoneForWhatsApp = (phoneStr: string): string => {
  if (!phoneStr) return '';
  // Remove non-digit characters
  let digits = phoneStr.replace(/\D/g, '');

  // If Pakistani number starts with 0 (e.g. 03001234567 -> 11 digits)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.substring(1);
  } else if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  return digits;
};

/**
 * Formats a clean, high-clarity WhatsApp message with item details, client name, invoice number, Total Bill, Payment Received, and Remaining Balance
 */
export const generateWhatsAppInvoiceMessage = (
  invoice: Invoice,
  businessInfo: BusinessInfo
): string => {
  const itemsText = invoice.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}*\n   Qty: ${item.quantity} × ${formatRupees(item.unitPrice)} = *${formatRupees(item.amount)}*`
    )
    .join('\n\n');

  const totalBill = invoice.totalBill ?? (invoice.grandTotal || (invoice.subtotal + (invoice.previousBalance || 0)));
  const paymentReceived = invoice.paymentReceived || 0;
  const remainingBalance = invoice.remainingBalance ?? (totalBill - paymentReceived);

  let balanceStatusLine = `🔹 *Remaining Balance:* ${formatRupees(remainingBalance)} (Paid in Full)`;
  if (remainingBalance > 0) {
    balanceStatusLine = `⚠️ *Remaining Balance (Due):* ${formatRupees(remainingBalance)}`;
  } else if (remainingBalance < 0) {
    balanceStatusLine = `ℹ️ *Advance / Excess Paid:* ${formatRupees(Math.abs(remainingBalance))}`;
  }

  return `🧾 *INVOICE: #${invoice.invoiceNumber}*
📅 *Date:* ${formatDate(invoice.invoiceDate)}
👤 *Client Name:* ${invoice.customerName}
${invoice.customerPhone ? `📞 *Phone:* ${invoice.customerPhone}\n` : ''}🏢 *From:* ${businessInfo.name}
📞 *Store Contact:* ${businessInfo.phone}

━━━━━━━━━━━━━━━━━━━━
📋 *ITEM DETAILS:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
▫️ *Items Subtotal:* ${formatRupees(invoice.subtotal)}
▫️ *Previous Balance:* ${formatRupees(invoice.previousBalance)}
💰 *TOTAL BILL:* ${formatRupees(totalBill)}
💵 *Payment Received:* ${formatRupees(paymentReceived)}
${balanceStatusLine}
━━━━━━━━━━━━━━━━━━━━

_Thank you for your business!_
_Please verify this invoice and remit payment._`;
};

/**
 * Directly opens WhatsApp chat (via https://wa.me/PHONE_NUMBER?text=...)
 */
export const openDirectWhatsApp = (
  invoice: Invoice,
  businessInfo: BusinessInfo
): void => {
  const message = generateWhatsAppInvoiceMessage(invoice, businessInfo);
  const cleanPhone = cleanPhoneForWhatsApp(invoice.customerPhone || '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(waUrl, '_blank');
};

/**
 * Triggers native navigator.share() on mobile devices if available,
 * otherwise opens WhatsApp directly via https://wa.me/PHONE_NUMBER
 */
export const shareInvoiceViaWhatsApp = async (
  invoice: Invoice,
  businessInfo: BusinessInfo
): Promise<'shared' | 'opened' | 'cancelled'> => {
  const message = generateWhatsAppInvoiceMessage(invoice, businessInfo);
  const cleanPhone = cleanPhoneForWhatsApp(invoice.customerPhone || '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  // Mobile Web Share API check
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `Invoice #${invoice.invoiceNumber} - ${invoice.customerName}`,
        text: message,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return 'cancelled';
      }
      // If native share was dismissed or unsupported, open direct WhatsApp URL
      window.open(waUrl, '_blank');
      return 'opened';
    }
  } else {
    // Desktop or non-supported browser -> open https://wa.me/PHONE_NUMBER
    window.open(waUrl, '_blank');
    return 'opened';
  }
};
