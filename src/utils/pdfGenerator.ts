import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Invoice, BusinessInfo } from '../types/invoice';
import { formatRupees, formatDate, cleanPhoneForWhatsApp } from './formatters';

/**
 * Friendly error helper that triggers alert('Image Error: ' + error.message)
 * while safely logging to console.
 */
function handleImageError(error: any): void {
  const message = error?.message || String(error);
  try {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert('Image Error: ' + message);
    }
  } catch {
    console.error('Image Error: ' + message);
  }
}

/**
 * Builds an off-screen HTML element representation of the invoice
 * styled and formatted for crisp single-image rendering (794px width).
 */
function createInvoicePrintElement(invoice: Invoice, businessInfo: BusinessInfo): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'invoice-render-area';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#ffffff';
  container.style.display = 'block';
  container.style.visibility = 'visible';
  container.style.color = '#000000';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.boxShadow = 'none';
  container.style.borderRadius = '0';
  container.style.border = 'none';
  container.style.margin = '0';

  const itemsCount = invoice.items?.length || 0;

  // Responsive padding and typography based on item density
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
    <div style="display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; width: 100%;">
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
        <div style="margin-top: 2px; font-size: 9px; color: #94a3b8;">Generated via InvoiceFlow</div>
      </div>
    </div>
  `;

  return container;
}

/**
 * Captures the invoice DOM element as a high-resolution HTML Canvas:
 * 1. Ensures target DOM element exists before calling html2canvas (document.getElementById('invoice-render-area')).
 * 2. Uses robust html2canvas configuration with scale: 2, useCORS: true, allowTaint: true, and onclone visibility hook.
 * 3. Removes outer card borders/shadows and restores original styles cleanly.
 */
export async function captureInvoiceCanvas(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<HTMLCanvasElement> {
  // Ensure target DOM element exists
  let element =
    sourceElement ||
    (document.getElementById('invoice-render-area') as HTMLElement | null) ||
    (document.getElementById('printable-invoice') as HTMLElement | null);

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
    background: element.style.background,
    backgroundColor: element.style.backgroundColor,
  };

  try {
    // Temporarily remove card-style box-shadow, border-radius, margin, and borders
    element.style.setProperty('box-shadow', 'none', 'important');
    element.style.setProperty('border-radius', '0', 'important');
    element.style.setProperty('border', 'none', 'important');
    element.style.setProperty('margin', '0', 'important');
    element.style.setProperty('padding', '28px 32px', 'important');
    element.style.setProperty('width', '794px', 'important');
    element.style.setProperty('max-width', '794px', 'important');
    element.style.setProperty('background-color', '#ffffff', 'important');
    element.style.setProperty('color', '#000000', 'important');

    // Allow browser frame to finish painting fonts and images
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
      onclone: (clonedDoc) => {
        const win = clonedDoc.defaultView || window;
        // Ensure element is visible and strip/convert unsupported oklch color functions
        const el =
          clonedDoc.getElementById('invoice-render-area') ||
          clonedDoc.getElementById('printable-invoice');
        if (el) {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#000000';
          const elements = el.querySelectorAll('*');
          elements.forEach((child) => {
            const htmlEl = child as HTMLElement;
            try {
              const style = win.getComputedStyle(htmlEl);
              if (style.color && style.color.includes('oklch')) {
                htmlEl.style.color = '#1f2937';
              }
              if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
                htmlEl.style.backgroundColor = '#ffffff';
              }
              if (style.borderColor && style.borderColor.includes('oklch')) {
                htmlEl.style.borderColor = '#e5e7eb';
              }
              if (style.borderTopColor && style.borderTopColor.includes('oklch')) {
                htmlEl.style.borderTopColor = '#e5e7eb';
              }
              if (style.borderBottomColor && style.borderBottomColor.includes('oklch')) {
                htmlEl.style.borderBottomColor = '#e5e7eb';
              }
              if (style.borderLeftColor && style.borderLeftColor.includes('oklch')) {
                htmlEl.style.borderLeftColor = '#e5e7eb';
              }
              if (style.borderRightColor && style.borderRightColor.includes('oklch')) {
                htmlEl.style.borderRightColor = '#e5e7eb';
              }
              if (style.boxShadow && style.boxShadow.includes('oklch')) {
                htmlEl.style.boxShadow = 'none';
              }
              if (style.outlineColor && style.outlineColor.includes('oklch')) {
                htmlEl.style.outlineColor = 'transparent';
              }
            } catch {
              // Ignore computedStyle error
            }
          });
        }
      },
    });

    return canvas;
  } finally {
    // Restore original styles on the DOM element
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
      element.style.background = originalStyles.background;
      element.style.backgroundColor = originalStyles.backgroundColor;
    }
  }
}

/**
 * Robust JPG Download Logic:
 * Converts canvas directly to dataUrl and downloads using anchor tag.
 * Wrapped in strict try/catch with alert('Image Error: ' + error.message).
 */
export async function downloadInvoiceImage(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<string> {
  const invoiceNumber = invoice.invoiceNumber || 'INV';
  try {
    const canvas = await captureInvoiceCanvas(invoice, businessInfo, sourceElement);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `Invoice_${invoiceNumber}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return `Invoice_${invoiceNumber}.jpg`;
  } catch (error: any) {
    handleImageError(error);
    throw error;
  }
}

/**
 * Reliable WhatsApp Share with Fallback:
 * Uses canvas.toBlob, checks Web Share API for files, or downloads image and opens WhatsApp chat.
 * Wrapped in strict try/catch with alert('Image Error: ' + error.message).
 */
export async function shareInvoiceViaWhatsAppImage(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<'shared' | 'opened_wa_and_downloaded' | 'cancelled'> {
  const invoiceNumber = invoice.invoiceNumber || 'INV';
  const phone = cleanPhoneForWhatsApp(invoice.customerPhone || '');

  try {
    const canvas = await captureInvoiceCanvas(invoice, businessInfo, sourceElement);

    return await new Promise<'shared' | 'opened_wa_and_downloaded' | 'cancelled'>((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          try {
            if (!blob) throw new Error('Canvas blob creation failed.');
            const imageFile = new File([blob], `Invoice_${invoiceNumber}.jpg`, { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
              try {
                await navigator.share({
                  title: `Invoice #${invoiceNumber}`,
                  files: [imageFile],
                });
                resolve('shared');
              } catch (err: any) {
                if (err.name === 'AbortError') {
                  resolve('cancelled');
                  return;
                }
                // Fallback: Download image first and open WhatsApp
                const link = document.createElement('a');
                link.download = `Invoice_${invoiceNumber}.jpg`;
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.open(
                  `https://wa.me/${phone}?text=${encodeURIComponent(`Invoice #${invoiceNumber} JPG downloaded.`)}`,
                  '_blank'
                );
                resolve('opened_wa_and_downloaded');
              }
            } else {
              // Download image first and open WhatsApp
              const link = document.createElement('a');
              link.download = `Invoice_${invoiceNumber}.jpg`;
              link.href = URL.createObjectURL(blob);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.open(
                `https://wa.me/${phone}?text=${encodeURIComponent(`Invoice #${invoiceNumber} JPG downloaded.`)}`,
                '_blank'
              );
              resolve('opened_wa_and_downloaded');
            }
          } catch (blobErr) {
            handleImageError(blobErr);
            reject(blobErr);
          }
        },
        'image/jpeg',
        0.95
      );
    });
  } catch (error: any) {
    handleImageError(error);
    throw error;
  }
}

/**
 * Generates an A4 Single-Page PDF with full bleed (0, 0, 210, 297mm)
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  businessInfo: BusinessInfo,
  sourceElement?: HTMLElement | null
): Promise<{ doc: jsPDF; pdfBlob: Blob; pdfFile: File; filename: string }> {
  const invoiceNumber = invoice.invoiceNumber || 'INV';
  const cleanInvNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Invoice_${cleanInvNumber}.pdf`;

  const canvas = await captureInvoiceCanvas(invoice, businessInfo, sourceElement);

  const doc = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  return { doc, pdfBlob, pdfFile, filename };
}

/**
 * Downloads single-page A4 invoice PDF
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
 * Alias to support WhatsApp sharing with image or PDF
 */
export const shareInvoiceWithPDF = shareInvoiceViaWhatsAppImage;
