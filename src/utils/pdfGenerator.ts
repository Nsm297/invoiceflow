import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate, cleanPhoneForWhatsApp, generateWhatsAppInvoiceMessage } from './formatters';

/**
 * Builds an off-screen HTML element representation of the invoice
 * optimized for single-page A4 auto-scaling.
 */
function createInvoicePrintElement(invoice: Invoice, businessInfo: BusinessInfo): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // Standard A4 pixel width at 96 DPI
  container.style.minHeight = '1123px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';

  const itemsCount = invoice.items?.length || 0;

  // Dynamic sizing based on number of items to guarantee 1-page fit
  let bodyPadding = '32px 36px';
  let headerMarginBottom = '16px';
  let tablePadding = '8px 10px';
  let fontSizeBase = '12px';
  let fontHeading = '20px';
  let fontInvNumber = '24px';
  let rowHeight = 'auto';
  let compactSummary = false;

  if (itemsCount > 18) {
    bodyPadding = '16px 20px';
    headerMarginBottom = '8px';
    tablePadding = '3px 6px';
    fontSizeBase = '9.5px';
    fontHeading = '15px';
    fontInvNumber = '17px';
    compactSummary = true;
  } else if (itemsCount > 12) {
    bodyPadding = '20px 24px';
    headerMarginBottom = '10px';
    tablePadding = '4px 8px';
    fontSizeBase = '10.5px';
    fontHeading = '17px';
    fontInvNumber = '19px';
    compactSummary = true;
  } else if (itemsCount > 7) {
    bodyPadding = '24px 28px';
    headerMarginBottom = '12px';
    tablePadding = '6px 8px';
    fontSizeBase = '11.5px';
    fontHeading = '18px';
    fontInvNumber = '21px';
  }

  container.style.padding = bodyPadding;
  container.style.fontSize = fontSizeBase;

  const totalBill =
    invoice.totalBill ??
    (invoice.grandTotal || (invoice.subtotal + (invoice.previousBalance || 0)));
  const paymentReceived = invoice.paymentReceived || 0;
  const remainingBalance = invoice.remainingBalance ?? (totalBill - paymentReceived);

  const itemsRows = (invoice.items || [])
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: ${tablePadding}; font-weight: 600; color: #1e293b; vertical-align: middle;">
          <div style="font-weight: 700;">${it.name || 'Item'}</div>
        </td>
        <td style="padding: ${tablePadding}; text-align: right; font-family: monospace; color: #334155; vertical-align: middle;">
          ${it.quantity}
        </td>
        <td style="padding: ${tablePadding}; text-align: right; font-family: monospace; color: #334155; vertical-align: middle;">
          ${formatRupees(it.unitPrice)}
        </td>
        <td style="padding: ${tablePadding}; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; vertical-align: middle;">
          ${formatRupees(it.amount)}
        </td>
      </tr>
    `
    )
    .join('');

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between; box-sizing: border-box;">
      <div>
        <!-- Store & Invoice Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: ${headerMarginBottom}; border-bottom: 2px solid #0f172a; margin-bottom: ${headerMarginBottom};">
          <div>
            <div style="font-size: ${fontHeading}; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; line-height: 1.2;">
              ${businessInfo.name || 'InvoiceFlow Store'}
            </div>
            ${
              businessInfo.tagline
                ? `<div style="font-size: 11px; color: #047857; font-style: italic; margin-top: 2px; font-weight: 600;">${businessInfo.tagline}</div>`
                : ''
            }
            <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
              ${businessInfo.phone ? `<div><strong>Phone:</strong> ${businessInfo.phone}</div>` : ''}
              ${businessInfo.address ? `<div><strong>Address:</strong> ${businessInfo.address}</div>` : ''}
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: ${fontInvNumber}; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
              INVOICE
            </div>
            <div style="font-family: monospace; font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              #${invoice.invoiceNumber || 'INV-001'}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">
              Date: <span style="font-weight: 600; color: #0f172a;">${formatDate(invoice.invoiceDate)}</span>
            </div>
          </div>
        </div>

        <!-- Customer Banner -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: ${headerMarginBottom}; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #64748b; display: block;">
              Billed To Customer
            </span>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 1px;">
              ${invoice.customerName || 'Walk-in Customer'}
            </div>
          </div>
          ${
            invoice.customerPhone
              ? `<div style="font-size: 11px; color: #334155; font-weight: 600; text-align: right;">
                  <span>Phone:</span> ${invoice.customerPhone}
                </div>`
              : ''
          }
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: ${headerMarginBottom};">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: ${tablePadding}; text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; width: 50%;">
                Item Description
              </th>
              <th style="padding: ${tablePadding}; text-align: right; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; width: 14%;">
                Qty
              </th>
              <th style="padding: ${tablePadding}; text-align: right; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; width: 18%;">
                Unit Price
              </th>
              <th style="padding: ${tablePadding}; text-align: right; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; width: 18%;">
                Amount (Rs.)
              </th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Summary & Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
          <div style="width: 320px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
            <div style="display: flex; justify-content: space-between; padding: ${compactSummary ? '2px 0' : '4px 0'}; font-size: 11.5px; color: #475569;">
              <span>Items Subtotal:</span>
              <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${formatRupees(invoice.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: ${compactSummary ? '2px 0' : '4px 0'}; font-size: 11.5px; color: #475569;">
              <span>Previous Balance:</span>
              <span style="font-family: monospace; font-weight: 700; color: #b45309;">${formatRupees(invoice.previousBalance)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: ${compactSummary ? '3px 0' : '6px 0'}; font-size: 13px; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1; margin-top: 4px;">
              <span>Total Bill:</span>
              <span style="font-family: monospace; font-weight: 900;">${formatRupees(totalBill)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: ${compactSummary ? '2px 0' : '4px 0'}; font-size: 11.5px; font-weight: 700; color: #0369a1;">
              <span>Payment Received:</span>
              <span style="font-family: monospace; font-weight: 800;">${formatRupees(paymentReceived)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: ${compactSummary ? '4px 0 0 0' : '8px 0 0 0'}; font-size: 14px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 4px;">
              <span>Remaining Balance:</span>
              <span style="font-family: monospace; font-weight: 900; color: ${remainingBalance === 0 ? '#047857' : remainingBalance > 0 ? '#b45309' : '#0369a1'};">
                ${formatRupees(remainingBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 8px; text-align: center; font-size: 10px; color: #64748b;">
        <div>Thank you for your business! For any billing queries, contact ${businessInfo.phone || 'us'}.</div>
        <div style="margin-top: 2px; font-size: 9px; color: #94a3b8;">Generated via InvoiceFlow · Single Page A4 Standard</div>
      </div>
    </div>
  `;

  return container;
}

/**
 * Generates an A4 single-page PDF as a Blob and File object.
 * Guaranteed 1-page fit using dynamic scale and jsPDF configuration (autoPaging: false).
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  businessInfo: BusinessInfo
): Promise<{ blob: Blob; file: File; filename: string; pdf: jsPDF }> {
  const element = createInvoicePrintElement(invoice, businessInfo);
  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp DPI
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });

    const pdfPageWidth = 210;
    const pdfPageHeight = 297;
    const margin = 8; // 8mm margin
    const contentMaxWidth = pdfPageWidth - margin * 2; // 194mm
    const contentMaxHeight = pdfPageHeight - margin * 2; // 281mm

    const imgWidth = contentMaxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Single-page auto-fitting: if height exceeds single A4 page, scale down proportionally
    if (imgHeight > contentMaxHeight) {
      const scaleFactor = contentMaxHeight / imgHeight;
      imgHeight = contentMaxHeight;
      const adjustedWidth = imgWidth * scaleFactor;
      const xOffset = (pdfPageWidth - adjustedWidth) / 2;
      const yOffset = margin;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, adjustedWidth, imgHeight, undefined, 'FAST');
    } else {
      const xOffset = margin;
      const yOffset = margin;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
    }

    const cleanCustName = (invoice.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanInvNumber = (invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Invoice_${cleanInvNumber}_${cleanCustName}.pdf`;

    const blob = pdf.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });

    return { blob, file, filename, pdf };
  } finally {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

/**
 * Triggers instant direct download of single-page A4 invoice PDF
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  businessInfo: BusinessInfo
): Promise<string> {
  const { blob, filename } = await generateInvoicePDF(invoice, businessInfo);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}

/**
 * Primary WhatsApp Sharing Handler with Web Share API file capability:
 * 1. Generates single-page invoice PDF File object.
 * 2. If navigator.canShare({ files: [pdfFile] }) is supported (e.g. mobile/supported browsers),
 *    invokes navigator.share() to send the actual PDF document directly to WhatsApp.
 * 3. If file sharing is unsupported (e.g. desktop web), triggers automatic PDF file download
 *    while opening WhatsApp with the customer's chat message and breakdown.
 */
export async function shareInvoiceWithPDF(
  invoice: Invoice,
  businessInfo: BusinessInfo
): Promise<'shared_file' | 'opened_wa_and_downloaded' | 'cancelled'> {
  // Step 1: Generate single-page PDF
  const { file, filename } = await generateInvoicePDF(invoice, businessInfo);

  // Step 2: Check if Web Share API with Files is supported
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof (navigator as any).canShare === 'function' &&
    (navigator as any).canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: `Invoice #${invoice.invoiceNumber || ''} - ${businessInfo.name || 'InvoiceFlow'}`,
        text: `Invoice #${invoice.invoiceNumber || ''} for ${invoice.customerName || 'Customer'} (Total: ${formatRupees(invoice.totalBill)})`,
      });
      return 'shared_file';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return 'cancelled';
      }
      // If user dismissed share sheet or failed, fallback to download + WA web
    }
  }

  // Fallback for Desktop Web or non-file share browsers:
  // Auto-download PDF and open WhatsApp Web with formatted summary
  const cleanPhone = cleanPhoneForWhatsApp(invoice.customerPhone || '');
  const message = generateWhatsAppInvoiceMessage(invoice, businessInfo);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  // 1. Download the PDF file automatically
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

  // 2. Open WhatsApp
  window.open(waUrl, '_blank');

  return 'opened_wa_and_downloaded';
}
