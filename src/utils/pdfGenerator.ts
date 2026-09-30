import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate, cleanPhoneForWhatsApp } from './formatters';

/**
 * Builds an off-screen HTML element representation of the invoice
 * styled and formatted for crisp full-bleed single-page A4 rendering (794px × 1123px).
 */
function createInvoicePrintElement(invoice: Invoice, businessInfo: BusinessInfo): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // Standard A4 pixel width at 96 DPI
  container.style.height = '1123px'; // Standard A4 pixel height at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';
  container.style.boxShadow = 'none';
  container.style.borderRadius = '0';
  container.style.border = 'none';
  container.style.margin = '0';

  const itemsCount = invoice.items?.length || 0;

  // Responsive padding and typography based on item density to guarantee 1-page fit
  let bodyPadding = '32px 36px';
  let headerMarginBottom = '16px';
  let tablePadding = '8px 10px';
  let fontSizeBase = '12px';
  let fontHeading = '20px';
  let fontInvNumber = '24px';
  let compactSummary = false;

  if (itemsCount > 18) {
    bodyPadding = '18px 22px';
    headerMarginBottom = '8px';
    tablePadding = '3px 6px';
    fontSizeBase = '9.5px';
    fontHeading = '15px';
    fontInvNumber = '17px';
    compactSummary = true;
  } else if (itemsCount > 12) {
    bodyPadding = '22px 26px';
    headerMarginBottom = '10px';
    tablePadding = '4px 8px';
    fontSizeBase = '10.5px';
    fontHeading = '17px';
    fontInvNumber = '19px';
    compactSummary = true;
  } else if (itemsCount > 7) {
    bodyPadding = '26px 30px';
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
    <div style="display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; height: 100%; width: 100%;">
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
 * Generates an A4 Single-Page PDF with full bleed (0, 0, 210, 297mm):
 * 1. Temporarily removes box-shadow, border-radius, margin, and outer padding from the invoice element.
 * 2. Ensures canvas renders at full A4 ratio dimensions (794px × 1123px).
 * 3. In jsPDF, initializes as A4 (new jsPDF('p', 'mm', 'a4')) and renders image at (0, 0) with width 210mm and height 297mm:
 *    doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
 * 4. Restores original styles on the DOM element after capturing.
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<{ doc: jsPDF; pdfBlob: Blob; pdfFile: File; filename: string }> {
  const invoiceNumber = invoice.invoiceNumber || 'INV';
  const cleanInvNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Invoice_${cleanInvNumber}.pdf`;

  // Look for existing #printable-invoice in DOM if sourceElement not provided
  let element = sourceElement || (document.getElementById('printable-invoice') as HTMLElement | null);
  let isCreated = false;

  if (!element) {
    element = createInvoicePrintElement(invoice, businessInfo);
    document.body.appendChild(element);
    isCreated = true;
  }

  // Backup original styles before modifying
  const originalStyles = {
    boxShadow: element.style.boxShadow,
    borderRadius: element.style.borderRadius,
    border: element.style.border,
    margin: element.style.margin,
    padding: element.style.padding,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minHeight: element.style.minHeight,
    height: element.style.height,
    background: element.style.background,
    backgroundColor: element.style.backgroundColor,
  };

  try {
    // 1. Temporarily remove box-shadow, border-radius, margin, and outer padding
    // so it spans full width/height without any card-style outer borders
    element.style.setProperty('box-shadow', 'none', 'important');
    element.style.setProperty('border-radius', '0', 'important');
    element.style.setProperty('border', 'none', 'important');
    element.style.setProperty('margin', '0', 'important');
    element.style.setProperty('padding', '32px 36px', 'important');
    element.style.setProperty('width', '794px', 'important');
    element.style.setProperty('max-width', '794px', 'important');
    element.style.setProperty('min-height', '1123px', 'important');
    element.style.setProperty('height', '1123px', 'important');
    element.style.setProperty('background-color', '#ffffff', 'important');

    // 2. Ensure canvas renders at full A4 ratio dimensions (794px × 1123px)
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp DPI
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
    });

    // 3. In jsPDF, initialize as A4 (new jsPDF('p', 'mm', 'a4'))
    const doc = new jsPDF('p', 'mm', 'a4');

    // Render image starting strictly at position (0, 0) with full width 210mm and height 297mm
    const imgData = canvas.toDataURL('image/png', 1.0);
    doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    return { doc, pdfBlob, pdfFile, filename };
  } finally {
    // 4. Restore original styles on the DOM element after capturing
    if (isCreated && element.parentNode) {
      element.parentNode.removeChild(element);
    } else if (element) {
      element.style.boxShadow = originalStyles.boxShadow;
      element.style.borderRadius = originalStyles.borderRadius;
      element.style.border = originalStyles.border;
      element.style.margin = originalStyles.margin;
      element.style.padding = originalStyles.padding;
      element.style.width = originalStyles.width;
      element.style.maxWidth = originalStyles.maxWidth;
      element.style.minHeight = originalStyles.minHeight;
      element.style.height = originalStyles.height;
      element.style.background = originalStyles.background;
      element.style.backgroundColor = originalStyles.backgroundColor;
    }
  }
}

/**
 * Triggers instant direct download of single-page A4 invoice PDF
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<string> {
  const { doc, filename } = await generateInvoicePDF(invoice, businessInfo, sourceElement);
  doc.save(filename);
  return filename;
}

/**
 * Reliable WhatsApp PDF File Share:
 * 1. Converts jsPDF output to Blob and File object:
 *    const pdfBlob = doc.output('blob');
 *    const pdfFile = new File([pdfBlob], `Invoice_${invoiceNumber}.pdf`, { type: 'application/pdf' });
 * 2. Checks Web Share API for files:
 *    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
 *      await navigator.share({
 *        title: 'Invoice PDF',
 *        text: 'Please find attached invoice PDF.',
 *        files: [pdfFile]
 *      });
 *    } else {
 *      // Fallback: Download PDF & open WhatsApp chat
 *      doc.save(`Invoice_${invoiceNumber}.pdf`);
 *      const encodedText = encodeURIComponent(`Invoice #${invoiceNumber} PDF attached.`);
 *      window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
 *    }
 */
export async function shareInvoiceWithPDF(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<'shared_file' | 'opened_wa_and_downloaded' | 'cancelled'> {
  const invoiceNumber = invoice.invoiceNumber || 'INV';
  const phone = cleanPhoneForWhatsApp(invoice.customerPhone || '');

  // Step 1: Generate full bleed single-page A4 PDF
  const { doc, pdfFile, filename } = await generateInvoicePDF(invoice, businessInfo, sourceElement);

  // Step 2: Check Web Share API for files
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof (navigator as any).canShare === 'function' &&
    (navigator as any).canShare({ files: [pdfFile] });

  if (canShareFiles) {
    try {
      await navigator.share({
        title: 'Invoice PDF',
        text: 'Please find attached invoice PDF.',
        files: [pdfFile],
      });
      return 'shared_file';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return 'cancelled';
      }
      // If user cancelled native dialog or share failed, execute fallback
    }
  }

  // Fallback: Download PDF & open WhatsApp chat
  doc.save(filename);
  const encodedText = encodeURIComponent(`Invoice #${invoiceNumber} PDF attached.`);
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(waUrl, '_blank');
  return 'opened_wa_and_downloaded';
}
